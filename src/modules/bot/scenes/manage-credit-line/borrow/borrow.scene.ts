import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { BotCommonService } from "../../../bot-common.service";
import { CustomExceptionFilter } from "../../../exception-filter";
import { bigintToFormattedPercent, formatUnitsNumber, parseUnits } from "src/common";
import { Markup } from "telegraf";
import { Message } from "telegraf/typings/core/types/typegram";
import { SignApplicationOptions } from "../../../constants";
import { callbackQuery } from "telegraf/filters";
import { MainScene } from "../../main.scene";
import * as filters from "telegraf/filters";
import { BorrowActionSteps, BorrowContext, BorrowReqCallbacks } from "./borrow.type";
import { BorrowTextSource } from "./borrow.text";
import { BotManagerService } from "src/modules/bot/bot-manager.service";
import { CreditLineStateMsgData, Requisites } from "../../common/types";
import {
    getCreditLineStateMsgData,
    getXLineRequestMsgData,
    getMaxAllowedBorrowAmount,
} from "../../common/utils";
import { validateAmountDecimals } from "src/common/input-validation";
import { truncateDecimals } from "src/common/text-formatter";

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
        const borrowPendingRequest = await this.botManager.getOldestUnfinalizedBorrowReq(creditLineId);
        const withdrawPendingRequest = await this.botManager.getOldestPendingWithdrawRequest(
            creditLineId
        );

        if (!borrowPendingRequest && !withdrawPendingRequest) {
            ctx.wizard.next();
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (borrowPendingRequest && withdrawPendingRequest) {
            throw new Error("Both borrow and withdraw requests are pending");
        }

        if (borrowPendingRequest) {
            const data = getXLineRequestMsgData(borrowPendingRequest);

            await ctx.editMessageText(BorrowTextSource.getExistingBorrowRequestErrorMsg(data), {
                parse_mode: "MarkdownV2",
            });
        }

        if (withdrawPendingRequest) {
            const data = getXLineRequestMsgData(withdrawPendingRequest);

            await ctx.editMessageText(BorrowTextSource.getExistingWithdrawRequestErrorMsg(data), {
                parse_mode: "MarkdownV2",
            });
        }

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                columns: 1,
            }).reply_markup
        );
        ctx.wizard.next();
    }

    @WizardStep(BorrowActionSteps.VERIFY_IS_BORROW_POSSIBLE)
    async onVerifyIsBorrowPossible(@Ctx() ctx: BorrowContext) {
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const cld = await this.botManager.getCreditLineDetails(creditLineId);

        if (cld.lineDetails.rawCollateralAmount <= 0n) {
            await ctx.editMessageText(BorrowTextSource.getZeroBalanceText(), {
                parse_mode: "MarkdownV2",
            });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                    columns: 1,
                }).reply_markup
            );
            ctx.wizard.next();
            return;
        }

        const maxAllowedBorrowAmount = getMaxAllowedBorrowAmount(cld);

        if (maxAllowedBorrowAmount <= 0n) {
            await ctx.editMessageText(BorrowTextSource.getZeroAllowedText(), {
                parse_mode: "MarkdownV2",
            });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                    columns: 1,
                }).reply_markup
            );
            ctx.wizard.next();
            return;
        }

        ctx.wizard.next();
        await this.botCommon.executeCurrentStep(ctx);
    }

    @WizardStep(BorrowActionSteps.BORROW_TERMS)
    async onBorrowTerms(@Ctx() ctx: BorrowContext) {
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const creditLine = await this.botManager.getCreditLinesByIdAllSettingsExtended(creditLineId);

        const collateralFactor = bigintToFormattedPercent(
            creditLine.economicalParameters.collateralFactor
        );
        const fee = bigintToFormattedPercent(creditLine.economicalParameters.fiatProcessingFee);

        const msg = (await ctx.editMessageText(
            BorrowTextSource.getBorrowTermsText(collateralFactor, fee, creditLine.debtCurrency.symbol),
            {
                parse_mode: "MarkdownV2",
            }
        )) as Message;

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

        const state = getCreditLineStateMsgData(cld);

        if (state.maxAllowedBorrowAmount <= 0) {
            await ctx.editMessageText(BorrowTextSource.getZeroAllowedText(), {
                parse_mode: "MarkdownV2",
            });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                    columns: 1,
                }).reply_markup
            );
            ctx.wizard.next();
            return;
        }

        const text = await BorrowTextSource.getAmountInputText(state);

        await ctx.editMessageText(text, {
            parse_mode: "MarkdownV2",
        });
        ctx.wizard.next();
    }

    @WizardStep(BorrowActionSteps.SIGN_TERMS)
    async onSignTerms(@Ctx() ctx: BorrowContext) {
        // FIXME: Optimize database and oracle usage
        const amount = Number(ctx.scene.session.state.borrowAmount);
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const cdl = await this.botManager.getCreditLineDetails(creditLineId);

        if (!amount) {
            throw new Error("No borrow amount provided");
        }

        const borrowFiatAmount = parseUnits(amount);

        const stateBefore = getCreditLineStateMsgData(cdl);
        const stateAfter: CreditLineStateMsgData = { ...stateBefore };

        //TODO: adapt for minimal fee value later
        const processingFee = formatUnitsNumber(cdl.economicalParams.fiatProcessingFee);

        const borroWithFee = await this.botManager.calculateBorrowAmountWithFee(
            creditLineId,
            borrowFiatAmount
        );

        stateAfter.debtAmount = truncateDecimals(
            stateBefore.debtAmount + formatUnitsNumber(borroWithFee),
            2
        );
        stateAfter.utilizationRatePercent = bigintToFormattedPercent(
            parseUnits(stateAfter.debtAmount / stateAfter.supplyAmountFiat)
        );

        const requisites: Requisites = {
            iban: cdl.lineDetails.userPaymentRequisite.iban,
            accountName: cdl.lineDetails.user.name,
        };

        const editMsgId = ctx.scene.session.state.sceneEditMsgId;
        await ctx.telegram.editMessageText(
            ctx.chat?.id,
            editMsgId,
            undefined,
            BorrowTextSource.getSignTermsText(
                stateBefore,
                stateAfter,
                amount,
                processingFee,
                requisites
            ),
            {
                parse_mode: "MarkdownV2",
            }
        );

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
                ctx.scene.session.cursor = BorrowActionSteps.AMOUNT_REQUEST;
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
            const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
            const creditLine = await this.botManager.getCreditLinesByIdAllSettingsExtended(creditLineId);

            const amount = ctx.scene.session.state.borrowAmount;
            if (!amount) throw new Error("No borrow amount provided");

            const borrowFiatAmount: bigint = parseUnits(amount);

            const requisites: Requisites = {
                iban: creditLine.userPaymentRequisite.iban,
                accountName: creditLine.user.name,
            };

            //FIXME: Think about adding some threshold for the amount
            try {
                await this.botManager.saveNewBorrowRequest(creditLine, borrowFiatAmount);
            } catch (e) {
                const errorMsg = BorrowTextSource.getFinalAmountValidationFailedMsg();
                await this.retryOrBackHandler(ctx, errorMsg, BorrowReqCallbacks.RE_ENTER__AMOUNT);
                return;
            }

            await ctx.editMessageText(
                BorrowTextSource.getBorrowSuccessText(requisites, creditLine.debtCurrency.symbol),
                {
                    parse_mode: "MarkdownV2",
                }
            );
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 }).reply_markup
            );
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
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const cld = await this.botManager.getCreditLineDetails(creditLineId);
        const state = getCreditLineStateMsgData(cld);

        const input = Number(userInput);
        if (!input || input <= 0) {
            const errorMsg = BorrowTextSource.getAmountValidationErrorMsg(userInput);
            await this.retryOrBackHandler(ctx, errorMsg, BorrowReqCallbacks.RE_ENTER__AMOUNT);
            return;
        } else if (!validateAmountDecimals(input, 2)) {
            const errorMsg = BorrowTextSource.getAmountDecimalsValidationErrorMsg(userInput, 2);
            await this.retryOrBackHandler(ctx, errorMsg, BorrowReqCallbacks.RE_ENTER__AMOUNT);
            return;
        } else if (input > state.maxAllowedBorrowAmount) {
            const errorMsg = BorrowTextSource.getAmountValidationErrorMaxAllowedMsg(
                userInput,
                state.maxAllowedBorrowAmount
            );
            await this.retryOrBackHandler(ctx, errorMsg, BorrowReqCallbacks.RE_ENTER__AMOUNT);
            return;
        } else {
            ctx.scene.session.state.borrowAmount = userInput;
            await this.botCommon.executeCurrentStep(ctx);
        }
    }

    // FIXME: Move to common
    private async retryOrBackHandler(ctx: BorrowContext, errorMsg: string, retryCallbackValue: string) {
        const editMsgId = ctx.scene.session.state.sceneEditMsgId;
        await ctx.telegram.editMessageText(ctx.chat?.id, editMsgId, undefined, errorMsg, {
            parse_mode: "MarkdownV2",
        });
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
