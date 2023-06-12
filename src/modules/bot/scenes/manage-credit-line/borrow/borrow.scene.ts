import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { BotCommonService } from "../../../bot-common.service";
import { CustomExceptionFilter } from "../../../exception-filter";
import { escapeSpecialCharacters, formatUnitsNumber, parseUnits } from "src/common";
import { Markup } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import { SignApplicationOptions } from "../../../constants";
import { callbackQuery } from "telegraf/filters";
import { MainScene } from "../../main.scene";
import * as filters from "telegraf/filters";
import { BorrowActionSteps, BorrowContext, BorrowReqCallbacks, CreditLineSnapshot } from "./borrow.type";
import { BorrowTextSource } from "./borrow.text";
import { BotManagerService, CreditLineDetailsExt } from "src/modules/bot/bot-manager.service";
import { EXP_SCALE } from "src/common/constants";

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(BorrowActionWizard.ID)
export class BorrowActionWizard {
    public static readonly ID = "BORROW_ACTION_WIZARD";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly botManager: BotManagerService
    ) {}

    @WizardStep(BorrowActionSteps.VERIFY_PENDING_REQUESTS)
    async onVerifyPendingRequests(@Ctx() ctx: BorrowContext) {
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const pendingRequest = await this.botManager.getOldestPendingBorrowReq(creditLineId);

        if (!pendingRequest) {
            ctx.wizard.next();
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        let text;
        const date = pendingRequest.createdAt.toLocaleDateString("en-GB");
        const currency = "USD"; //FIXME: get from request
        if (pendingRequest.borrowFiatAmount) {
            const amount = formatUnitsNumber(pendingRequest.borrowFiatAmount);
            text = BorrowTextSource.getExistingBorrowRequestErrorMsg(currency, date, amount);
        } else if (pendingRequest.initialRiskStrategy) {
            const strategy = formatUnitsNumber(pendingRequest.initialRiskStrategy);
            text = BorrowTextSource.getExistingBorrowRequestErrorMsg(
                currency,
                date,
                undefined,
                strategy
            );
        } else {
            throw new Error("Invalid pending request. Nether strategy, nor amount are defined");
        }

        const msg = (await ctx.editMessageText(text, {
            parse_mode: "MarkdownV2",
        })) as Message;

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                columns: 1,
            }).reply_markup
        );
        this.botCommon.tryToSaveSceneMessage(ctx, [msg]);
        ctx.wizard.next();
    }

    @WizardStep(BorrowActionSteps.BORROW_TERMS)
    async onBorrowTerms(@Ctx() ctx: BorrowContext) {
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const cld = await this.botManager.getCreditLineDetails(creditLineId);

        const maxCollateral = formatUnitsNumber(cld.economicalParams.collateralFactor) * 100;
        const fee = formatUnitsNumber(cld.economicalParams.fiatProcessingFee) * 100;

        const msg = (await ctx.editMessageText(BorrowTextSource.getBorrowTermsText(maxCollateral, fee), {
            parse_mode: "MarkdownV2",
        })) as Message;

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(
                [
                    {
                        text: "✅  Ok, let's proceed",
                        callback_data: `${BorrowReqCallbacks.APPROVE_TERMS}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                {
                    columns: 1,
                }
            ).reply_markup
        );
        ctx.scene.session.state.sceneEditMsgId = msg.message_id;
        ctx.wizard.next();
    }

    @WizardStep(BorrowActionSteps.AMOUNT_REQUEST)
    async onAmountRequest(@Ctx() ctx: BorrowContext) {
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const cld = await this.botManager.getCreditLineDetails(creditLineId);
        const snapshot = this.prepareCreditLineSnapshot(cld);
        ctx.scene.session.state.maxAllowedAmount = snapshot.maxAllowedAmount.toString();

        const text = await BorrowTextSource.getAmountInputText(snapshot);
        await ctx.editMessageText(text, {
            parse_mode: "MarkdownV2",
        });
        ctx.wizard.next();
    }

    @WizardStep(BorrowActionSteps.SIGN_TERMS)
    async onSignTerms(@Ctx() ctx: BorrowContext) {
        const borrowAmount = Number(ctx.scene.session.state.borrowAmount);
        if (!borrowAmount) {
            throw new Error("No debt amount provided");
        }

        const chat_id = ctx.chat!.id;

        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const cdl = await this.botManager.getCreditLineDetails(creditLineId);

        const user = await this.botManager.getUserByChatId(chat_id);
        const requisite = await this.botManager.getUserPaymentRequisiteByChatId(chat_id);

        const iban = requisite?.iban;
        const name = user?.name;

        if (!iban || !name) {
            throw new Error("User has no requisite or name");
        }

        const before = this.prepareCreditLineSnapshot(cdl);

        const after: CreditLineSnapshot = { ...before };
        after.debtAmount = before.debtAmount + borrowAmount;
        after.utilizationRate = (after.debtAmount / after.depositFiat) * 100;
        after.maxAllowedAmount = after.maxAllowedAmount - (after.debtAmount - before.debtAmount);

        const editMsgId = ctx.scene.session.state.sceneEditMsgId;
        const msg = (await ctx.telegram.editMessageText(
            ctx.chat?.id,
            editMsgId,
            undefined,
            BorrowTextSource.getSignTermsText(before, after, borrowAmount, name, iban),
            {
                parse_mode: "MarkdownV2",
            }
        )) as Message;

        await ctx.telegram.editMessageReplyMarkup(
            ctx.chat?.id,
            editMsgId,
            undefined,
            Markup.inlineKeyboard(
                [
                    {
                        text: "✅ Approve",
                        callback_data: `${BorrowReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.APPROVE}`,
                    },
                    {
                        text: "❌ Disapprove",
                        callback_data: `${BorrowReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.DISAPPROVE}`,
                    },
                ],
                {
                    columns: 1,
                }
            ).reply_markup
        );
        ctx.scene.session.state.sceneEditMsgId = msg.message_id;
        ctx.wizard.next();
    }

    @Action(/.*/)
    async sceneActionHandler(@Ctx() ctx: BorrowContext) {
        // Enter scene handler.
        if (ctx.scene.session.cursor == BorrowActionSteps.VERIFY_PENDING_REQUESTS) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }
        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case BorrowReqCallbacks.SIGN_APPLICATION:
                await this.signApplicationHandler(ctx, value);
                break;
            case BorrowReqCallbacks.APPROVE_TERMS:
                await this.approveTermsHandler(ctx, value);
                break;
            case BorrowReqCallbacks.RE_ENTER__AMOUNT:
                ctx.wizard.back();
                await this.botCommon.executeCurrentStep(ctx);
                break;
            case BorrowReqCallbacks.BACK_TO_MAIN_MENU:
                await this.botCommon.tryToDeleteMessages(ctx, true);
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    @Hears(/.*/)
    async userMessageHandler(@Ctx() ctx: BorrowContext) {
        // Catch user input to remove it with step message
        if (!ctx.has(filters.message("text"))) return;
        try {
            await ctx.deleteMessage(ctx.message.message_id);
        } catch {}

        const userMessageText = ctx.message.text;
        const currentCursor = ctx.scene.session.cursor;

        // We should to substitute 1 from current cursor,
        // due to each scene handler moves the pointer to the next scene
        switch (currentCursor - 1) {
            case BorrowActionSteps.AMOUNT_REQUEST:
                await this.reqAmountHandler(ctx, userMessageText);
                break;
            default:
                // Redirect to main scene if user input is "/start"
                if (ctx.message.text === "/start") {
                    await this.botCommon.tryToDeleteMessages(ctx, true);
                    await ctx.scene.enter(MainScene.ID);
                }
        }
    }

    private async signApplicationHandler(ctx: BorrowContext, callbackValue?: string) {
        if (callbackValue === SignApplicationOptions.APPROVE) {
            const chat_id = ctx.chat!.id;
            const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
            const user = await this.botManager.getUserByChatId(chat_id);
            const requisite = await this.botManager.getUserPaymentRequisiteByChatId(chat_id);

            const iban = requisite?.iban;
            const name = user?.name;

            if (!iban || !name) {
                throw new Error("User has no requisite or name");
            }

            await ctx.editMessageText(BorrowTextSource.getBorrowSuccessText(name, iban), {
                parse_mode: "MarkdownV2",
            });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 }).reply_markup
            );

            const amount = ctx.scene.session.state.borrowAmount;
            if (!amount) throw new Error("No borrow amount provided");

            const borrowFiatAmount = parseUnits(amount);

            await this.botManager.saveNewBorrowRequest(creditLineId, borrowFiatAmount);
        } else if (callbackValue === SignApplicationOptions.DISAPPROVE) {
            await ctx.editMessageText(BorrowTextSource.getBorrowDisapprovedText(), {
                parse_mode: "MarkdownV2",
            });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 }).reply_markup
            );
        } else {
            throw new Error("Incorrect sign application option");
        }
    }

    private async approveTermsHandler(ctx: BorrowContext, callbackValue?: string) {
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async reqAmountHandler(ctx: BorrowContext, userInput: string) {
        const input = Number(userInput);
        const maxAllowed = Number(ctx.scene.session.state.maxAllowedAmount);

        if (!input || input <= 0) {
            const errorMsg = BorrowTextSource.getAmountValidationErrorMsg(userInput);
            await this.retryOrBackHandler(ctx, errorMsg, BorrowReqCallbacks.RE_ENTER__AMOUNT);
        } else if (input > maxAllowed) {
            const errorMsg = BorrowTextSource.getAmountValidationErrorMaxAllowedMsg(
                userInput,
                maxAllowed
            );
            await this.retryOrBackHandler(ctx, errorMsg, BorrowReqCallbacks.RE_ENTER__AMOUNT);
        } else {
            ctx.scene.session.state.borrowAmount = userInput;
            await this.botCommon.executeCurrentStep(ctx);
        }
    }

    private prepareCreditLineSnapshot(cld: CreditLineDetailsExt): CreditLineSnapshot {
        return {
            depositCrypto: formatUnitsNumber(
                cld.lineDetails.rawCollateralAmount,
                cld.lineDetails.collateralToken.decimals
            ),
            depositFiat: formatUnitsNumber(cld.lineDetails.fiatCollateralAmount),
            cryptoCurrency: cld.lineDetails.collateralToken.symbol,
            fiatCurrency: cld.lineDetails.debtToken.symbol,
            debtAmount: formatUnitsNumber(cld.lineDetails.debtAmount),
            utilizationRate: formatUnitsNumber(cld.lineDetails.utilizationRate) * 100,
            maxUtilizationRate: formatUnitsNumber(cld.economicalParams.collateralFactor) * 100,
            maxAllowedAmount: formatUnitsNumber(
                (cld.lineDetails.fiatCollateralAmount * cld.economicalParams.collateralFactor) /
                    EXP_SCALE -
                    cld.lineDetails.debtAmount
            ),
        };
    }

    // FIXME: Move to common
    private async retryOrBackHandler(ctx: BorrowContext, errorMsg: string, retryCallbackValue: string) {
        const editMsgId = ctx.scene.session.state.sceneEditMsgId;
        await ctx.telegram.editMessageText(
            ctx.chat?.id,
            editMsgId,
            undefined,
            escapeSpecialCharacters(errorMsg),
            { parse_mode: "MarkdownV2" }
        );
        await ctx.telegram.editMessageReplyMarkup(
            ctx.chat?.id,
            editMsgId,
            undefined,
            Markup.inlineKeyboard(
                [
                    {
                        text: "🔁 Try again",
                        callback_data: `${retryCallbackValue}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                { columns: 2 }
            ).reply_markup
        );
    }
}
