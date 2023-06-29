import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import * as filters from "telegraf/filters";
import { callbackQuery } from "telegraf/filters";
import { DefaultSessionState, ExtendedSessionData, ExtendedWizardContext } from "../../../bot.types";
import { CustomExceptionFilter } from "../../../exception-filter";
import { BotCommonService } from "../../../bot-common.service";
import { BotManagerService } from "../../../bot-manager.service";
import { SignApplicationOptions } from "../../../constants";
import { RepayTextSource } from "./repay.text";
import { InlineKeyboardButton } from "typegram/markup";
import { MainScene } from "../../main.scene";
import { createRepayRequestRefNumber } from "../../../../../common";

export enum RepaySteps {
    VERIFY_PENDING_REQUESTS,
    SIGN_APPLICATION,
}

export enum RepayCallbacks {
    SIGN_APPLICATION = "choseCreditLine",
    BACK_TO_MAIN_MENU = "back",
}

type RepaySessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        referenceNumber?: string;
    };
};

export type RepayContext = ExtendedWizardContext<RepaySessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(RepayActionWizard.ID)
export class RepayActionWizard {
    public static readonly ID = "REPAY_ACTION_WIZARD";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly botManager: BotManagerService
    ) {}

    @WizardStep(RepaySteps.VERIFY_PENDING_REQUESTS)
    async onVerifyPendingRequests(@Ctx() ctx: RepayContext) {
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const pendingRequest = await this.botManager.getOldestPendingRepayReq(creditLineId);

        if (!pendingRequest) {
            ctx.wizard.next();
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        // In case when repay request already exists

        const businessPaymentRequisite = await this.botManager.getBusinessPayReqByRequestId(
            pendingRequest.id
        );
        const creditLine = await this.botManager.getCreditLineById(creditLineId);

        const refNumber = createRepayRequestRefNumber(creditLine.refNumber, pendingRequest.id);
        const msgText = RepayTextSource.getVerifyPendingRequestText(businessPaymentRequisite, refNumber);

        const buttons: InlineKeyboardButton[] = [this.botCommon.goBackButton()];

        await ctx.editMessageText(msgText, { parse_mode: "MarkdownV2" });
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(buttons, {
                columns: 1,
            }).reply_markup
        );

        ctx.wizard.next();
    }

    @WizardStep(RepaySteps.SIGN_APPLICATION)
    async onRepayInfo(@Ctx() ctx: RepayContext) {
        const buttons = [
            {
                text: "✅ Approve",
                callback_data: `${RepayCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.APPROVE}`,
            },
            {
                text: "❌ Disapprove",
                callback_data: `${RepayCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.DISAPPROVE}`,
            },
        ];

        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const { lineDetails } = await this.botManager.getCreditLineDetails(creditLineId);

        ctx.scene.session.state.referenceNumber = lineDetails.refNumber;

        const msgText = RepayTextSource.getRepayInfoText(lineDetails);

        await ctx.editMessageText(msgText, { parse_mode: "MarkdownV2" });
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(buttons, {
                columns: 1,
            }).reply_markup
        );
        ctx.wizard.next();
    }

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: RepayContext) {
        // Enter scene handler.
        if (ctx.scene.session.cursor == RepaySteps.VERIFY_PENDING_REQUESTS) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case RepayCallbacks.SIGN_APPLICATION:
                await this.signApplicationActionHandler(ctx, value);
                break;
            case RepayCallbacks.BACK_TO_MAIN_MENU:
                await this.botCommon.tryToDeleteMessages(ctx, true);
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    @Hears(/.*/)
    async userMessageHandler(@Ctx() ctx: RepayContext) {
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

    private async signApplicationActionHandler(ctx: RepayContext, callbackValue?: string) {
        if (!callbackValue) throw new Error("Incorrect callback received");
        if (!ctx.scene.session.state.referenceNumber)
            throw new Error("Reference number does not exist in the scene data");

        const buttons: InlineKeyboardButton[] = [this.botCommon.goBackButton()];

        if (callbackValue === SignApplicationOptions.APPROVE) {
            const debtSymbol = this.botCommon.getDebtCurrencyFromSceneDto(ctx).symbol;
            const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);

            const businessPaymentRequisite = await this.botManager.getFreshBusinessPayReqByDebtSymbol(
                debtSymbol
            );
            const newRepayRequest = await this.botManager.saveNewRepayRequest(
                creditLineId,
                businessPaymentRequisite.id
            );

            const uniqRefNumber = createRepayRequestRefNumber(
                ctx.scene.session.state.referenceNumber,
                newRepayRequest.id
            );
            const msgText = RepayTextSource.getApproveRepayRequest(
                businessPaymentRequisite,
                uniqRefNumber
            );

            await ctx.editMessageText(msgText, {
                parse_mode: "MarkdownV2",
            });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard(buttons, {
                    columns: 1,
                }).reply_markup
            );
        } else if (callbackValue === SignApplicationOptions.DISAPPROVE) {
            const msgText = RepayTextSource.getRejectRepayText();

            await ctx.editMessageText(msgText, { parse_mode: "MarkdownV2" });
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
