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
    ACTION_OVERVIEW,
    WALLET_REQUEST,
    SIGN_TERMS,
}
enum WithdrawReqCallbacks {
    START = "start",
    SIGN_APPLICATION = "signApplication",
    BACK_TO_MAIN_MENU = "back",
}

type WithdrawActionSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        chat_id?: string;
        userWallet?: string;
        targetCurrency?: string;
    };
};
type WithdrawContext = ExtendedWizardContext<WithdrawActionSessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(WithdrawActionWizard.ID)
export class WithdrawActionWizard {
    public static readonly ID = "WITHDRAW_ACTION_WIZARD";

    constructor(private readonly botCommon: BotCommonService) {}

    @WizardStep(RepayActionSteps.ACTION_OVERVIEW)
    async onActionOverview(@Ctx() ctx: WithdrawContext) {
        const msg = await ctx.reply(
            "🔂 Withdraw operation allows you to collect back remaining collateral funds to provided wallet address",
            Markup.inlineKeyboard([
                {
                    text: "✅ Ok, go proceed",
                    callback_data: `${WithdrawReqCallbacks.START}`,
                },
                this.botCommon.goBackButton(),
            ])
        );

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(RepayActionSteps.WALLET_REQUEST)
    async onWalletRequest(@Ctx() ctx: WithdrawContext) {
        const msg = await ctx.reply(`📬 Please provide the address to get funds on`);

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(RepayActionSteps.SIGN_TERMS)
    async onSignTerms(@Ctx() ctx: WithdrawContext) {
        const state = ctx.scene.session.state;
        const targetWallet = state.userWallet;
        const remainingAmount = 15.874;
        const targetCurrency = ctx.session.targetCurrency;

        const msg = await ctx.reply(
            `💸 Confirming a "Withdraw" operation will generate a "Withdraw request" \n` +
                `\n` +
                `Entire remaining amount of your collateral ${remainingAmount} ${targetCurrency} will be send to the address: ${targetWallet}.`,
            Markup.inlineKeyboard(
                [
                    {
                        text: "✅ Approve",
                        callback_data: `${WithdrawReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.APPROVE}`,
                    },
                    {
                        text: "❌ Disapprove",
                        callback_data: `${WithdrawReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.DISAPPROVE}`,
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
    async onActionHandler(@Ctx() ctx: WithdrawContext) {
        await this.botCommon.tryToDeleteMessages(ctx);
        if (ctx.scene.session.cursor == RepayActionSteps.ACTION_OVERVIEW) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case WithdrawReqCallbacks.START:
                await this.botCommon.executeCurrentStep(ctx);
                break;
            case WithdrawReqCallbacks.SIGN_APPLICATION:
                await this.signApplicationHandler(ctx, value);
                break;
            case WithdrawReqCallbacks.BACK_TO_MAIN_MENU:
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    @Hears(/.*/)
    async onMessageHandler(@Ctx() ctx: WithdrawContext) {
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
                await this.walletRequestHandler(ctx, userMessageText);
                break;
            default:
                throw new Error("Could not find scene handler for the target message");
        }
    }

    private async signApplicationHandler(ctx: WithdrawContext, callbackValue?: string) {
        let msg;
        if (callbackValue === SignApplicationOptions.APPROVE) {
            // TODO: save to the database new withdraw request before the user notification
            msg = await ctx.reply(
                `✅ Yahoo! You've created withdraw request! \n` + `\n` + `📥 Expect to receive money!`,
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 })
            );
        } else if (callbackValue === SignApplicationOptions.DISAPPROVE) {
            msg = await ctx.reply(
                "❌ You've rejected withdraw request! \n" + "Maybe next time, who knows ⚖",
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 })
            );
        } else {
            throw new Error("Incorrect sign application option");
        }

        return msg;
    }

    private async walletRequestHandler(ctx: WithdrawContext, userInput: string) {
        ctx.scene.session.state.userWallet = userInput;
        await this.botCommon.executeCurrentStep(ctx);
    }
}
