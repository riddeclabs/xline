import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import { CustomExceptionFilter } from "../../exception-filter";
import { BotCommonService } from "../../bot-common.service";
import { BotManagerService } from "../../bot-manager.service";
import { MainScene } from "../main.scene";
import { ManageCreditLineText } from "./manage-credit-line.text";
import { NewCreditRequestContext } from "../new-credit-request/new-credit-request.types";
import * as filters from "telegraf/filters";
import {
    LineActions,
    ManageCreditLineContext,
    ManagePortfolioCallbacks,
    ManagePortfolioSteps,
} from "./manage-credit-line.types";
import { RepayActionWizard } from "./repay/repay.scene";

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(ManageCreditLineWizard.ID)
export class ManageCreditLineWizard {
    public static readonly ID = "MANAGE_CREDIT_LINE_WIZARD";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly botManager: BotManagerService
    ) {}

    @WizardStep(ManagePortfolioSteps.CHOSE_CREDIT_LINE)
    async onChoseCreditLine(@Ctx() ctx: ManageCreditLineContext) {
        const creditLines = await this.botManager.getUserCreditLinesCurrencyExtended(ctx.chat!.id);

        const buttons = [this.botCommon.goBackButton()];
        if (creditLines.length) {
            const existPairs = creditLines.map(cl => {
                return {
                    text: `${cl.collateralToken.symbol} / ${cl.debtToken.symbol}`,
                    callback_data: `${ManagePortfolioCallbacks.CHOSE_CREDIT_LINE}:${cl.id}`,
                };
            });
            buttons.unshift(...existPairs);
        }

        const stepText = ManageCreditLineText.getChoseCreditLineText();
        const msgText = creditLines.length ? stepText.existLineText : stepText.notFoundText;

        await ctx.editMessageText(msgText, { parse_mode: "MarkdownV2" });
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(buttons, {
                columns: 1,
            }).reply_markup
        );
        ctx.wizard.next();
    }

    @WizardStep(ManagePortfolioSteps.VIEW_LINE_DETAILS)
    async onViewCreditLine(@Ctx() ctx: ManageCreditLineContext) {
        const { economicalParams, lineDetails } = await this.botManager.getCreditLineDetails(
            Number(ctx.scene.session.state.creditLineId)
        );

        this.botCommon.updateSceneCreditLineDto(ctx, {
            collateralSymbol: lineDetails.collateralToken.symbol,
            debtSymbol: lineDetails.debtToken.symbol,
        });

        const msgText = ManageCreditLineText.getViewLineDetailsText(economicalParams, lineDetails);

        const buttons = [
            {
                text: "Deposit",
                callback_data: `${ManagePortfolioCallbacks.VIEW_LINE_DETAILS}:${LineActions.DEPOSIT}`,
            },
            {
                text: "Withdraw",
                callback_data: `${ManagePortfolioCallbacks.VIEW_LINE_DETAILS}:${LineActions.WITHDRAW}`,
            },
            {
                text: "Borrow",
                callback_data: `${ManagePortfolioCallbacks.VIEW_LINE_DETAILS}:${LineActions.BORROW}`,
            },
            {
                text: "Repay",
                callback_data: `${ManagePortfolioCallbacks.VIEW_LINE_DETAILS}:${LineActions.REPAY}`,
            },
            this.botCommon.goBackButton(),
        ];

        await ctx.editMessageText(msgText, { parse_mode: "MarkdownV2" });
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(buttons, {
                columns: 1,
            }).reply_markup
        );
        ctx.wizard.next();
    }

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: ManageCreditLineContext) {
        // Enter scene handler.
        if (ctx.scene.session.cursor == ManagePortfolioSteps.CHOSE_CREDIT_LINE) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case ManagePortfolioCallbacks.CHOSE_CREDIT_LINE:
                await this.choseCreditLineActionHandler(ctx, value);
                break;
            case ManagePortfolioCallbacks.VIEW_LINE_DETAILS:
                await this.viewCreditLineActionHandler(ctx, value);
                break;
            case ManagePortfolioCallbacks.BACK_TO_MAIN_MENU:
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    @Hears(/.*/)
    async userMessageHandler(@Ctx() ctx: NewCreditRequestContext) {
        // Catch user input to remove it with step message
        if (!ctx.has(filters.message("text"))) return;

        // This scene does not provide for user input, just delete the message
        try {
            await ctx.deleteMessage(ctx.message.message_id);
        } catch {}
    }

    private async choseCreditLineActionHandler(ctx: ManageCreditLineContext, callbackValue?: string) {
        if (!callbackValue) throw new Error("Incorrect callback received");

        ctx.scene.session.state.creditLineId = callbackValue;
        this.botCommon.updateSceneCreditLineDto(ctx, {
            creditLineId: Number(callbackValue),
        });

        await this.botCommon.executeCurrentStep(ctx);
    }

    private async viewCreditLineActionHandler(ctx: ManageCreditLineContext, callbackValue?: string) {
        if (!callbackValue) throw new Error("Incorrect callback received");

        switch (callbackValue) {
            case LineActions.DEPOSIT: {
                await ctx.scene.enter(MainScene.ID);
                break;
            }
            case LineActions.WITHDRAW: {
                await ctx.scene.enter(MainScene.ID);
                break;
            }
            case LineActions.BORROW: {
                await ctx.scene.enter(MainScene.ID);
                break;
            }
            case LineActions.REPAY: {
                await ctx.scene.enter(RepayActionWizard.ID);
                break;
            }
            default:
                throw new Error("Unrecognised callback value");
        }
    }
}
