import { Injectable, UseFilters } from "@nestjs/common";
import * as filters from "telegraf/filters";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import { MainScene } from "./main.scene";
import { DefaultSessionState, ExtendedSessionData, ExtendedWizardContext } from "../bot.types";
import { BotCommonService } from "../bot-common.service";
import { SignApplicationOptions } from "../constants";
import { CustomExceptionFilter } from "../exception-filter";

enum RepayActionSteps {
    WALLET_REQUEST,
    SIGN_TERMS,
}

enum RepayReqCallbacks {
    SIGN_APPLICATION = "signApplication",
    BACK_TO_MAIN_MENU = "back",
}

type RepayActionSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        chat_id?: string;
        userWallet?: string;
    };
};
type RepayContext = ExtendedWizardContext<RepayActionSessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(RepayActionWizard.ID)
export class RepayActionWizard {
    public static readonly ID = "REPAY_ACTION_WIZARD";

    constructor(private readonly botCommon: BotCommonService) {}

    @WizardStep(RepayActionSteps.WALLET_REQUEST)
    async onWalletRequest(@Ctx() ctx: RepayContext) {
        const msg = await ctx.reply(
            "🔂 After repaying your credit position, collateral amount will be sent to the address you provided \n" +
                `\n` +
                ` Please provide the address to get funds on`
        );

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(RepayActionSteps.SIGN_TERMS)
    async onSignTerms(@Ctx() ctx: RepayContext) {
        console.log("🍋🍋🍋<<<<<<<<<< HELLO. I AM INSIDE THE onSignTerms POINT OF REPAY SCENE >>>>>>>");

        const targetWallet = ctx.scene.session.state.userWallet;
        // Get targetCurrency from `ViewActiveCreditLineWizard` scene
        const targetToken = ctx.session.targetCurrency;

        // TODO: get real data from the database

        const msg = await ctx.reply(
            `💸 Confirming a "Repay" operation will generate a "Repay request" \n` +
                `Once the loan amount has been received, the credit line will be closed and you will receive the entire amount of the collateral, except for the loan usage fee, to the address you provided. \n` +
                `\n` +
                `Detail information \n` +
                `Usage fee: ${127} EUR\n` +
                `Original collateral deposit amount: ${84.75} ${targetToken}\n` +
                `Amount of deposit receivable: ${83.79} ${targetToken} \n` +
                `Loan redemption amount: ${18758.25} EUR\n` +
                `\n` +
                `The deposit will be sent to the address ${targetWallet}`,
            Markup.inlineKeyboard(
                [
                    {
                        text: "✅ Approve",
                        callback_data: `${RepayReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.APPROVE}`,
                    },
                    {
                        text: "❌ Disapprove",
                        callback_data: `${RepayReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.DISAPPROVE}`,
                    },
                ],
                {
                    columns: 1,
                }
            )
        );

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: RepayContext) {
        await this.botCommon.tryToDeleteMessages(ctx);

        // Enter scene handler.
        if (ctx.scene.session.cursor == RepayActionSteps.WALLET_REQUEST) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case RepayReqCallbacks.SIGN_APPLICATION:
                await this.signApplicationHandler(ctx, value);
                break;
            case RepayReqCallbacks.BACK_TO_MAIN_MENU:
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    @Hears(/.*/)
    async onMessageHandler(@Ctx() ctx: RepayContext) {
        // Catch user input to remove it with step message
        this.botCommon.tryToSaveSceneMessage(ctx, ctx.message);
        await this.botCommon.tryToDeleteMessages(ctx);

        if (!ctx.has(filters.message("text"))) return;
        const userMessageText = ctx.message.text;
        const currentCursor = ctx.scene.session.cursor;

        // We should to substitute 1 from current cursor,
        // due to each scene handler moves the pointer to the next scene
        switch (currentCursor - 1) {
            case RepayActionSteps.WALLET_REQUEST:
                // Do not save `msg`, we just collect data.
                await this.walletRequestHandler(ctx, userMessageText);
                break;
            default:
                throw new Error("Could not find handler for the target message");
        }
    }

    private async signApplicationHandler(ctx: RepayContext, callbackValue?: string) {
        let msg;
        if (callbackValue === SignApplicationOptions.APPROVE) {
            // TODO: get actual data from the database
            const fiatRepayAmount = 18457.968;
            // TODO: get repay request processing timeout from the database
            const processingTimeout = 30;
            // TODO: get actual data from database
            const ibanToGetRepayOn = "EU BM 1111 2222 3333 4444";

            // TODO: save to the database new repay request before the user notification

            msg = await ctx.reply(
                `✅ Yahoo! You've created repay request! \n` +
                    "\n" +
                    `Please send ${fiatRepayAmount} EUR to IBAN: ${ibanToGetRepayOn} \n` +
                    `\n` +
                    `⌛ Request will expire in ${processingTimeout} minutes.`,
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 })
            );
        } else if (callbackValue === SignApplicationOptions.DISAPPROVE) {
            msg = await ctx.reply(
                "❌ You've rejected repay request! \n" + "Maybe next time, who knows ⚖",
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 })
            );
        } else {
            throw new Error("Incorrect sign application option");
        }

        return msg;
    }

    private async walletRequestHandler(ctx: RepayContext, userInput: string) {
        ctx.scene.session.state.userWallet = userInput;
        await this.botCommon.executeCurrentStep(ctx);
    }
}
