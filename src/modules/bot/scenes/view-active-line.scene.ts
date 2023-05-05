import { Injectable, UseFilters } from "@nestjs/common";

import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { SUPPORTED_TOKENS } from "../constants";
import { callbackQuery } from "telegraf/filters";
import { MainScene } from "./main.scene";
import { RepayActionWizard } from "./repay.scene";
import { WithdrawActionWizard } from "./withdraw.scene";
import { BotCommonService } from "../bot-common.service";
import { DefaultSessionState, ExtendedSessionData, ExtendedWizardContext } from "../bot.types";
import { CustomExceptionFilter } from "../exception-filter";

enum ViewActiveLineSteps {
    OVERVIEW,
    CREDIT_LINE_DETAILS,
}
enum ViewLineCallbacks {
    OVERVIEW = "overview",
    CREDIT_LINE_ACTION = "creditLineAction",
    BACK_TO_MAIN_MENU = "back",
}
enum CreditLineActions {
    REPAY = "repay",
    WITHDRAW = "withdraw",
}

type ViewLineSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        chat_id?: string;
        targetCurrency?: string;
    };
};
type ViewActiveCreditLineContext = ExtendedWizardContext<ViewLineSessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(ViewActiveCreditLineWizard.ID)
export class ViewActiveCreditLineWizard {
    public static readonly ID = "VIEW_ACTIVE_CREDIT_LINE_WIZARD";

    constructor(private readonly botCommon: BotCommonService) {}

    @WizardStep(ViewActiveLineSteps.OVERVIEW)
    async onOverview(@Ctx() ctx: ViewActiveCreditLineContext) {
        // TODO: get actual data from the database
        const ethLinesCount = await this.getActiveLineCount("ETH");
        const btcLinesCount = await this.getActiveLineCount("BTC");

        const msg = await ctx.reply(
            "〽 You have the following active credit lines \n" +
                `\n` +
                `💴 ETH: ${ethLinesCount} \n` +
                `💴 BTC: ${btcLinesCount}`,
            Markup.inlineKeyboard(
                [
                    {
                        text: "View ETH lines",
                        callback_data: `${ViewLineCallbacks.OVERVIEW}:${SUPPORTED_TOKENS.ETH}`,
                    },
                    {
                        text: "View BTC lines",
                        callback_data: `${ViewLineCallbacks.OVERVIEW}:${SUPPORTED_TOKENS.BTC}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                {
                    columns: 1,
                }
            )
        );

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(ViewActiveLineSteps.CREDIT_LINE_DETAILS)
    async onCreditLineDetails(@Ctx() ctx: ViewActiveCreditLineContext) {
        const targetCurrency = ctx.scene.session.state.targetCurrency;

        // TODO: get actual data from the database
        // cls - Credit Line Details
        const cld = (await this.getActiveCreditLineDetails(targetCurrency))[0];

        // Message for case when there is active credit line
        const existMsg =
            `💶 Your active ${targetCurrency} credit line: \n` +
            `HealthyFactor: ${cld?.healthFactor} \n` +
            `Total fee accumulated: ${cld?.feeAccumulatedFiat} EUR\n` +
            `Supply collateral amount: ${cld?.rawCollateralAmount} ${targetCurrency}\n` +
            `Collateral amount in ${targetCurrency}: ${
                cld?.rawCollateralAmount! * cld?.liquidationFactor!
            } ${targetCurrency}\n` +
            `Debt amount: ${cld?.debtAmountFiat} EUR\n` +
            `Has been liquidated: ${cld?.isLiquidated ? "Yes" : "No"} \n` +
            `\n` +
            `📊 Applied rates:\n` +
            `APR: ${cld?.apr} % \n` +
            `CollateralFactor: ${cld?.collateralFactor! * 100} % \n` +
            `LiquidationFactor: ${cld?.liquidationFactor! * 100} % \n` +
            `LiquidationFee: ${cld?.liquidationFee! * 100} %`;

        // Message for case when there is nou active credit line
        const notExistMsg =
            `💸 For ${targetCurrency} you don't have active credit lines \n` +
            `Use "New credit request" button to create a new one`;

        const msg = await ctx.reply(
            cld ? existMsg : notExistMsg,
            Markup.inlineKeyboard(
                [
                    ...(cld
                        ? cld?.isLiquidated
                            ? [
                                  {
                                      text: "Withdraw",
                                      callback_data: `${ViewLineCallbacks.CREDIT_LINE_ACTION}:${CreditLineActions.WITHDRAW}`,
                                  },
                              ]
                            : [
                                  {
                                      text: "Repay",
                                      callback_data: `${ViewLineCallbacks.CREDIT_LINE_ACTION}:${CreditLineActions.REPAY}`,
                                  },
                              ]
                        : []),
                    this.botCommon.goBackButton(),
                ],
                {
                    columns: 1,
                }
            )
        );

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    // Action handlers

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: ViewActiveCreditLineContext) {
        await this.botCommon.tryToDeleteMessages(ctx);
        if (ctx.scene.session.cursor == ViewActiveLineSteps.OVERVIEW) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case ViewLineCallbacks.OVERVIEW:
                await this.overviewActionHandler(ctx, value);
                break;
            case ViewLineCallbacks.CREDIT_LINE_ACTION:
                await this.creditLineActionHandler(ctx, value);
                break;
            case ViewLineCallbacks.BACK_TO_MAIN_MENU:
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    @Hears(/.*/)
    async onMessageHandler(@Ctx() ctx: ViewActiveCreditLineContext) {
        this.botCommon.tryToSaveSceneMessage(ctx, ctx.message);
        await this.botCommon.tryToDeleteMessages(ctx);

        throw new Error("Unexpected user message received");
    }

    private async overviewActionHandler(ctx: ViewActiveCreditLineContext, callbackValue?: string) {
        const state = ctx.scene.session.state;

        if (
            !callbackValue ||
            !Object.values(SUPPORTED_TOKENS).includes(callbackValue as SUPPORTED_TOKENS)
        )
            throw new Error("Incorrect collateral currency");

        state.targetCurrency = callbackValue;
        ctx.session.targetCurrency = callbackValue;

        await this.botCommon.executeCurrentStep(ctx);
    }

    private async creditLineActionHandler(ctx: ViewActiveCreditLineContext, callbackValue?: string) {
        if (callbackValue === CreditLineActions.REPAY) {
            await ctx.scene.enter(RepayActionWizard.ID);
        } else if (callbackValue === CreditLineActions.WITHDRAW) {
            await ctx.scene.enter(WithdrawActionWizard.ID);
        } else throw new Error("Incorrect credit line action");
    }

    // Helper functions

    private async getActiveLineCount(collateralToken: string): Promise<number> {
        return (await this.getActiveCreditLineDetails(collateralToken)).length;
    }

    private async getActiveCreditLineDetails(collateralToken?: string) {
        const ethCreditLineDetails = [
            {
                iban: "EU BM 0145 5588 4476 8877",
                apr: 12,
                collateralFactor: 0.8,
                liquidationFactor: 0.9,
                liquidationFee: 0.06,
                creditLineStateStatus: "Active",
                rawCollateralAmount: 87.54,
                feeAccumulatedFiat: 127,
                healthFactor: 1.247,
                debtAmountFiat: 18745.896,
                isLiquidated: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        ];

        const btcCreditLineDetails = [
            {
                iban: "EU BM 0145 5588 4476 8877",
                apr: 12,
                collateralFactor: 0.8,
                liquidationFactor: 0.9,
                liquidationFee: 0.06,
                creditLineStateStatus: "Active",
                rawCollateralAmount: 87.54,
                feeAccumulatedFiat: 127,
                healthFactor: 1.247,
                debtAmountFiat: 18745.896,
                isLiquidated: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            },
        ];

        return collateralToken === "ETH" ? ethCreditLineDetails : btcCreditLineDetails;
    }
}
