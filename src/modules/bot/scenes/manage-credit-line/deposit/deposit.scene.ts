import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import * as filters from "telegraf/filters";
import { CustomExceptionFilter } from "../../../exception-filter";
import { BotCommonService } from "../../../bot-common.service";
import { BotManagerService } from "../../../bot-manager.service";
import { SignApplicationOptions, SUPPORTED_TOKENS } from "../../../constants";
import { DepositTextSource } from "./deposit.text";
import { InlineKeyboardButton } from "typegram/markup";
import { MainScene } from "../../main.scene";
import { Message } from "typegram";
import { DepositSteps, DepositContext, DepositCallbacks } from "./deposit.types";

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(DepositActionWizard.ID)
export class DepositActionWizard {
    public static readonly ID = "DEPOSIT_ACTION_WIZARD";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly botManager: BotManagerService
    ) {}

    @WizardStep(DepositSteps.VERIFY_PENDING_REQUESTS)
    async onVerifyPendingRequests(@Ctx() ctx: DepositContext) {
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const pendingRequest = await this.botManager.getOldestPendingDepositReq(creditLineId);

        if (!pendingRequest) {
            ctx.wizard.next();
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        const collateralSymbol = this.botCommon.getCollateralCurrencyFromSceneDto(ctx).symbol;
        const wallet = await this.botManager.getUserWallet(ctx.chat!.id.toString(), collateralSymbol);

        const buttons: InlineKeyboardButton[] = [this.botCommon.goBackButton()];
        if (collateralSymbol === SUPPORTED_TOKENS.ETH) {
            buttons.unshift(this.botCommon.getMetamaskWalletButton(wallet));
        }

        const mainMsgText = DepositTextSource.getVerifyPendingRequestText(wallet);
        const detailsText = DepositTextSource.getApproveDepositText(wallet);

        const msg = (await ctx.editMessageText(mainMsgText, { parse_mode: "MarkdownV2" })) as Message;
        const msg1 = await ctx.replyWithPhoto(detailsText.qrCodeLink);
        const msg2 = await ctx.replyWithMarkdownV2(
            detailsText.detailsMsg,
            Markup.inlineKeyboard(buttons, { columns: 1 })
        );

        this.botCommon.tryToSaveSceneMessage(ctx, [msg, msg1, msg2]);
        ctx.wizard.next();
    }

    @WizardStep(DepositSteps.SIGN_APPLICATION)
    async onDepositInfo(@Ctx() ctx: DepositContext) {
        const buttons = [
            {
                text: "✅ Approve",
                callback_data: `${DepositCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.APPROVE}`,
            },
            {
                text: "❌ Disapprove",
                callback_data: `${DepositCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.DISAPPROVE}`,
            },
        ];

        const collateralSymbol = this.botCommon.getCollateralCurrencyFromSceneDto(ctx).symbol;

        const msgText = DepositTextSource.getDepositInfoText(collateralSymbol);

        await ctx.editMessageText(msgText, { parse_mode: "MarkdownV2" });
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(buttons, {
                columns: 1,
            }).reply_markup
        );
        ctx.wizard.next();
    }

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: DepositContext) {
        // Enter scene handler.
        if (ctx.scene.session.cursor == DepositSteps.VERIFY_PENDING_REQUESTS) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case DepositCallbacks.SIGN_APPLICATION:
                await this.choseCreditLineActionHandler(ctx, value);
                break;
            case DepositCallbacks.BACK_TO_MAIN_MENU:
                await this.botCommon.tryToDeleteMessages(ctx, true);
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    @Hears(/.*/)
    async userMessageHandler(@Ctx() ctx: DepositContext) {
        // Catch user input to remove it with step message
        if (!ctx.has(filters.message("text"))) return;

        // This scene does not provide for user input, just delete the message
        try {
            await ctx.deleteMessage(ctx.message.message_id);
        } catch {}

        // Redirect to main scene if user input is "/start"
        if (ctx.message.text === "/start") {
            await this.botCommon.tryToDeleteMessages(ctx, true);
            await ctx.scene.enter(MainScene.ID);
        }
    }

    private async choseCreditLineActionHandler(ctx: DepositContext, callbackValue?: string) {
        if (!callbackValue) throw new Error("Incorrect callback received");

        const collateralSymbol = this.botCommon.getCollateralCurrencyFromSceneDto(ctx).symbol;
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);

        const buttons: InlineKeyboardButton[] = [this.botCommon.goBackButton()];

        if (callbackValue === SignApplicationOptions.APPROVE) {
            const wallet = await this.botManager.getUserWallet(
                ctx.chat!.id.toString(),
                collateralSymbol
            );

            await this.botManager.saveNewDepositRequest(creditLineId);

            if (collateralSymbol === SUPPORTED_TOKENS.ETH) {
                buttons.unshift(this.botCommon.getMetamaskWalletButton(wallet));
            }

            const stepMessage = DepositTextSource.getApproveDepositText(wallet);

            const msg = (await ctx.editMessageText(stepMessage.mainMsg, {
                parse_mode: "MarkdownV2",
            })) as Message;
            const msg1 = await ctx.replyWithPhoto(stepMessage.qrCodeLink);
            const msg2 = await ctx.replyWithMarkdownV2(
                stepMessage.detailsMsg,
                Markup.inlineKeyboard(buttons, { columns: 1 })
            );

            this.botCommon.tryToSaveSceneMessage(ctx, [msg, msg1, msg2]);
        } else if (callbackValue === SignApplicationOptions.DISAPPROVE) {
            const stepMessage = DepositTextSource.getRejectDepositText();

            await ctx.editMessageText(stepMessage, { parse_mode: "MarkdownV2" });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard(buttons, {
                    columns: 1,
                }).reply_markup
            );
        } else {
            throw new Error("Incorrect sign application option");
        }
    }
}
