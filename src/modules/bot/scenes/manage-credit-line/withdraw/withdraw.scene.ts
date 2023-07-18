import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import * as filters from "telegraf/filters";
import { callbackQuery } from "telegraf/filters";
import { CustomExceptionFilter } from "../../../exception-filter";
import { BotCommonService } from "../../../bot-common.service";
import { BotManagerService } from "../../../bot-manager.service";
import { SignApplicationOptions } from "../../../constants";
import { WithdrawTextSource } from "./withdraw.text";
import { InlineKeyboardButton } from "typegram/markup";
import { MainScene } from "../../main.scene";
import { Message } from "typegram";
import {
    validateAddressToWithdraw,
    validateWithdrawInputValue,
    WithdrawSceneValidationStatus,
} from "../../../../../common/input-validation";
import { formatUnits, parseUnits, WithdrawRequestStatus } from "../../../../../common";
import { DepositActionWizard } from "../deposit/deposit.scene";
import { maxUint256 } from "../../../../../common/constants";
import { WithdrawRequest } from "../../../../../database/entities";
import { WithdrawCallbacks, WithdrawContext, WithdrawSteps } from "./withdraw.types";
import { getXLineRequestMsgData } from "../../common/utils";

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(WithdrawActionWizard.ID)
export class WithdrawActionWizard {
    public static readonly ID = "WITHDRAW_ACTION_WIZARD";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly botManager: BotManagerService
    ) {}

    @WizardStep(WithdrawSteps.VERIFY_PENDING_REQUESTS)
    async onVerifyPendingRequests(@Ctx() ctx: WithdrawContext) {
        ctx.wizard.next();

        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const pendingWithdrawRequest = await this.botManager.getOldestPendingWithdrawRequest(
            creditLineId
        );
        const pendingBorrowRequest = await this.botManager.getOldestUnfinalizedBorrowReq(creditLineId);

        const updateMessage = async (messageText: string, isRedirect: boolean) => {
            const buttons: InlineKeyboardButton[] = [this.botCommon.goBackButton()];

            if (isRedirect)
                buttons.unshift({
                    text: "💰 Make Deposit",
                    callback_data: WithdrawCallbacks.DEPOSIT_REDIRECT,
                });

            await ctx.editMessageText(messageText, { parse_mode: "MarkdownV2" });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard(buttons, {
                    columns: 1,
                }).reply_markup
            );
        };

        if (!pendingWithdrawRequest && !pendingBorrowRequest) {
            const creditLine = await this.botManager.accrueInterestAndGetCLAllSettingsExtended(
                creditLineId
            );
            const creditLineExtras = await this.botManager.getCreditLineExtras(creditLine);

            if (creditLine.rawCollateralAmount <= 0n) {
                const msgText = WithdrawTextSource.getZeroBalanceText();
                await updateMessage(msgText, true);
                return;
            } else if (creditLineExtras.maxAllowedCryptoToWithdraw <= 0n) {
                const msgText = WithdrawTextSource.getInsufficientBalanceText(
                    creditLineExtras.utilizationRate,
                    creditLine.economicalParameters.collateralFactor
                );
                await updateMessage(msgText, true);
                return;
            }

            await this.botCommon.executeCurrentStep(ctx);
            return;
        } else if (pendingWithdrawRequest && pendingBorrowRequest) {
            throw new Error("Both withdraw and borrow requests are pending");
        } else {
            let mainMsgText = "";
            if (pendingWithdrawRequest) {
                const withdrawReqData = getXLineRequestMsgData(pendingWithdrawRequest);
                mainMsgText = WithdrawTextSource.getExistingWithdrawPendingRequestText(withdrawReqData);
            } else if (pendingBorrowRequest) {
                const borrowReqData = getXLineRequestMsgData(pendingBorrowRequest);
                mainMsgText = WithdrawTextSource.getExistingBorrowPendingRequestText(borrowReqData);
            }
            await updateMessage(mainMsgText, false);
        }
    }

    @WizardStep(WithdrawSteps.SIGN_WITHDRAW_TERMS)
    async onWithdrawTerms(@Ctx() ctx: WithdrawContext) {
        const buttons = [
            {
                text: "✅ Ok, let's proceed",
                callback_data: `${WithdrawCallbacks.SIGN_WITHDRAW_TERMS}:${SignApplicationOptions.APPROVE}`,
            },
            this.botCommon.goBackButton(),
        ];

        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const economicalParameters = await this.botManager.getEconomicalParamsByLineId(creditLineId);
        const msgText = WithdrawTextSource.getWithdrawInfoText(
            economicalParameters.cryptoProcessingFee,
            economicalParameters.collateralFactor
        );

        const msg = (await ctx.editMessageText(msgText, { parse_mode: "MarkdownV2" })) as Message;
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(buttons, {
                columns: 1,
            }).reply_markup
        );

        ctx.scene.session.state.sceneEditMsgId = msg.message_id;
        ctx.wizard.next();
    }

    @WizardStep(WithdrawSteps.ENTER_WITHDRAW_AMOUNT)
    async onEnterWithdrawAmount(@Ctx() ctx: WithdrawContext) {
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);

        const creditLine = await this.botManager.accrueInterestAndGetCLAllSettingsExtended(creditLineId);
        const creditLineExtras = await this.botManager.getCreditLineExtras(creditLine);

        let msgText: string;
        let buttons: InlineKeyboardButton[] = [];

        if (creditLine.debtAmount === 0n) {
            // Set flag to handle this case in further steps
            ctx.scene.session.state.isWithdrawAllCase = true;

            msgText = WithdrawTextSource.getFullWithdrawEnterAmountText(
                creditLine.collateralCurrency,
                creditLine.rawCollateralAmount,
                creditLineExtras.maxAllowedCryptoToWithdraw,
                creditLineExtras.utilizationRate
            );

            buttons = [
                {
                    text: "Withdraw all",
                    callback_data: WithdrawCallbacks.WITHDRAW_ALL,
                },
                this.botCommon.goBackButton(),
            ];
        } else {
            msgText = WithdrawTextSource.getGeneralEnterAmountText(
                creditLine.collateralCurrency,
                creditLine.rawCollateralAmount,
                creditLineExtras.maxAllowedCryptoToWithdraw,
                creditLineExtras.utilizationRate,
                creditLine.economicalParameters.collateralFactor
            );
        }

        await ctx.editMessageText(msgText, { parse_mode: "MarkdownV2" });
        if (buttons.length) {
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard(buttons, {
                    columns: 1,
                }).reply_markup
            );
        }
        ctx.wizard.next();
    }

    @WizardStep(WithdrawSteps.ENTER_ADDRESS_TO_WITHDRAW)
    async onEnterAddressToWithdraw(@Ctx() ctx: WithdrawContext) {
        const collateralSymbol = this.botCommon.getCollateralCurrencyFromSceneDto(ctx).symbol;
        const msgText = WithdrawTextSource.getEnterAddressToWithdrawText(collateralSymbol);

        const editMsgId = ctx.scene.session.state.sceneEditMsgId;

        await ctx.telegram.editMessageText(ctx.chat?.id, editMsgId, undefined, msgText, {
            parse_mode: "MarkdownV2",
        });

        ctx.wizard.next();
    }

    @WizardStep(WithdrawSteps.SIGN_WITHDRAW_APPLICATION)
    async onSignWithdrawApplication(@Ctx() ctx: WithdrawContext) {
        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
        const collateralCurrency = this.botCommon.getCollateralCurrencyFromSceneDto(ctx);

        const requestedWithdrawAmount = ctx.scene.session.state.requestedWithdrawAmountRaw;
        const addressToWithdraw = ctx.scene.session.state.addressToWithdraw;
        const isWithdrawAllCase = ctx.scene.session.state.isWithdrawAllCase;

        if (
            !addressToWithdraw ||
            (!isWithdrawAllCase && !requestedWithdrawAmount) ||
            (isWithdrawAllCase && requestedWithdrawAmount)
        ) {
            throw new Error("Withdraw scene: some of scene parameters are missed or incorrect");
        }

        const requestedWithdrawAmountRaw = requestedWithdrawAmount
            ? parseUnits(requestedWithdrawAmount, collateralCurrency.decimals)
            : maxUint256;
        const withdrawRequestDetails = await this.botManager.calculateWithdrawRequestDetails(
            creditLineId,
            requestedWithdrawAmountRaw
        );

        const msgText = WithdrawTextSource.getSignWithdrawApplicationText(
            withdrawRequestDetails,
            addressToWithdraw,
            requestedWithdrawAmountRaw
        );

        const buttons = [
            {
                text: "✅ Approve",
                callback_data: `${WithdrawCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.APPROVE}`,
            },
            {
                text: "❌ Disapprove",
                callback_data: `${WithdrawCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.DISAPPROVE}`,
            },
        ];

        const editMsgId = ctx.scene.session.state.sceneEditMsgId;
        await ctx.telegram.editMessageText(ctx.chat?.id, editMsgId, undefined, msgText, {
            parse_mode: "MarkdownV2",
        });
        await ctx.telegram.editMessageReplyMarkup(
            ctx.chat?.id,
            editMsgId,
            undefined,
            Markup.inlineKeyboard(buttons, { columns: 1 }).reply_markup
        );

        ctx.wizard.next();
    }

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: WithdrawContext) {
        // Enter scene handler.
        if (ctx.scene.session.cursor == WithdrawSteps.VERIFY_PENDING_REQUESTS) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case WithdrawCallbacks.SIGN_WITHDRAW_TERMS:
                await this.onWithdrawTermsHandler(ctx, value);
                break;
            case WithdrawCallbacks.SIGN_APPLICATION:
                await this.onSignApplicationHandler(ctx, value);
                break;
            case WithdrawCallbacks.INCORRECT_USER_INPUT:
                ctx.wizard.back();
                await this.botCommon.executeCurrentStep(ctx);
                break;
            case WithdrawCallbacks.WITHDRAW_ALL:
                await this.enterWithdrawAmountHandler(ctx, WithdrawCallbacks.WITHDRAW_ALL);
                break;
            case WithdrawCallbacks.DEPOSIT_REDIRECT:
                await ctx.scene.enter(DepositActionWizard.ID);
                break;
            case WithdrawCallbacks.BACK_TO_MAIN_MENU:
                await this.botCommon.tryToDeleteMessages(ctx, true);
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    @Hears(/.*/)
    async userMessageHandler(@Ctx() ctx: WithdrawContext) {
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
            case WithdrawSteps.ENTER_WITHDRAW_AMOUNT:
                await this.enterWithdrawAmountHandler(ctx, userMessageText);
                break;
            case WithdrawSteps.ENTER_ADDRESS_TO_WITHDRAW:
                await this.enterAddressToWithdraw(ctx, userMessageText);
                break;
            default:
                // Redirect to main scene if user input is "/start"
                if (ctx.message.text === "/start") {
                    await this.botCommon.tryToDeleteMessages(ctx, true);
                    await ctx.scene.enter(MainScene.ID);
                }
        }
    }

    private async onWithdrawTermsHandler(ctx: WithdrawContext, callbackValue?: string) {
        // For withdraw terms we have only one possible callback option
        if (callbackValue === SignApplicationOptions.APPROVE) {
            await this.botCommon.executeCurrentStep(ctx);
        } else {
            throw new Error("Incorrect sign withdraw terms option");
        }
    }

    private async enterWithdrawAmountHandler(ctx: WithdrawContext, userInput: string) {
        // Handle 'Withdraw all' case, if this flag is enabled, we allow only `WITHDRAW_ALL` callback.
        if (ctx.scene.session.state.isWithdrawAllCase) {
            // In case of correct callback we show next step, otherwise just return
            if (userInput === WithdrawCallbacks.WITHDRAW_ALL) {
                await this.botCommon.executeCurrentStep(ctx);
            }
            return;
        }

        const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);

        const creditLine = await this.botManager.accrueInterestAndGetCLAllSettingsExtended(creditLineId);
        const creditLineExtras = await this.botManager.getCreditLineExtras(creditLine);

        const validationStatus = validateWithdrawInputValue(
            userInput,
            creditLine.collateralCurrency,
            creditLineExtras.maxAllowedCryptoToWithdraw
        );

        // In case of correct input go to the next step
        if (validationStatus === WithdrawSceneValidationStatus.CORRECT) {
            ctx.scene.session.state.requestedWithdrawAmountRaw = userInput;
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        // In case of invalid input, render error message accordingly
        let errorMsg: string;
        switch (validationStatus) {
            case WithdrawSceneValidationStatus.INCORRECT_DECIMALS:
                errorMsg = WithdrawTextSource.getIncorrectInputDecimalsText(
                    userInput,
                    creditLine.collateralCurrency
                );
                break;
            case WithdrawSceneValidationStatus.INCORRECT_STRUCT_OR_ZERO:
                errorMsg = WithdrawTextSource.getIncorrectInputStructText(
                    userInput,
                    creditLine.collateralCurrency
                );
                break;
            case WithdrawSceneValidationStatus.EXCEEDS_MAX_AMOUNT:
                errorMsg = WithdrawTextSource.getIncorrectInputMaxAmountText(
                    userInput,
                    creditLine.collateralCurrency,
                    creditLineExtras.maxAllowedCryptoToWithdraw
                );
                break;
            default:
                throw new Error("Incorrect validation reason");
        }

        await this.botCommon.retryOrBackHandler(ctx, errorMsg, WithdrawCallbacks.INCORRECT_USER_INPUT);
    }

    private async enterAddressToWithdraw(ctx: WithdrawContext, userInput: string) {
        const collateralCurrency = this.botCommon.getCollateralCurrencyFromSceneDto(ctx);

        const isAddressValid = validateAddressToWithdraw(userInput, collateralCurrency);

        if (!isAddressValid) {
            const errorMsg = WithdrawTextSource.getAddressValidationErrorText(
                userInput,
                collateralCurrency
            );
            await this.botCommon.retryOrBackHandler(
                ctx,
                errorMsg,
                WithdrawCallbacks.INCORRECT_USER_INPUT
            );
        } else {
            ctx.scene.session.state.addressToWithdraw = userInput;
            await this.botCommon.executeCurrentStep(ctx);
        }
    }

    private async onSignApplicationHandler(ctx: WithdrawContext, callbackValue?: string) {
        const buttons: InlineKeyboardButton[] = [this.botCommon.goBackButton()];

        if (callbackValue === SignApplicationOptions.APPROVE) {
            const creditLineId = this.botCommon.getCreditLineIdFromSceneDto(ctx);
            const collateralCurrency = this.botCommon.getCollateralCurrencyFromSceneDto(ctx);

            const addressToWithdraw = ctx.scene.session.state.addressToWithdraw;
            const requestedWithdrawAmount = ctx.scene.session.state.requestedWithdrawAmountRaw;
            const isWithdrawAllCase = ctx.scene.session.state.isWithdrawAllCase;

            if (
                !addressToWithdraw ||
                (!isWithdrawAllCase && !requestedWithdrawAmount) ||
                (isWithdrawAllCase && requestedWithdrawAmount)
            ) {
                throw new Error("Withdraw scene: some of scene parameters are missed or incorrect");
            }

            const creditLine = await this.botManager.accrueInterestAndGetCLAllSettingsExtended(
                creditLineId
            );
            const creditLineExtras = await this.botManager.getCreditLineExtras(creditLine);

            const actualWithdrawAmount = requestedWithdrawAmount
                ? parseUnits(requestedWithdrawAmount, collateralCurrency.decimals)
                : creditLineExtras.maxAllowedCryptoToWithdraw;

            let withdrawRequest: WithdrawRequest;
            try {
                await this.botManager.verifyHypWithdrawRequestOrThrow(
                    creditLineExtras.maxAllowedCryptoToWithdraw,
                    actualWithdrawAmount
                );
                withdrawRequest = await this.botManager.saveNewWithdrawRequest(
                    creditLineId,
                    addressToWithdraw,
                    actualWithdrawAmount
                );
            } catch (e: unknown) {
                if (e instanceof Error && e.message === "Insufficient liquidity to withdraw") {
                    const errorMsg = WithdrawTextSource.getFinalAllowedWithdrawAmountCheckText();
                    // Set the cursor that aims to the next step of ENTER_WITHDRAW_AMOUNT, to handle callback correctly
                    ctx.scene.session.cursor = WithdrawSteps.ENTER_WITHDRAW_AMOUNT + 1;
                    await this.botCommon.retryOrBackHandler(
                        ctx,
                        errorMsg,
                        WithdrawCallbacks.INCORRECT_USER_INPUT
                    );
                    return;
                }
                throw e;
            }

            try {
                await this.botManager.paymentProcessingService.sendWithdrawRequest(
                    collateralCurrency.symbol,
                    formatUnits(actualWithdrawAmount, collateralCurrency.decimals),
                    addressToWithdraw,
                    ctx.chat!.id
                );
            } catch (e) {
                await this.botManager.requestHandlerService.updateWithdrawReqStatus(
                    withdrawRequest.id,
                    WithdrawRequestStatus.UNSUCCESSFUL_PAYMENT_PROCESSING_REQUEST
                );
                const errorMsgText = WithdrawTextSource.getWithdrawalProcessingErrorText();
                await ctx.editMessageText(errorMsgText, { parse_mode: "MarkdownV2" });
                await ctx.editMessageReplyMarkup(
                    Markup.inlineKeyboard(buttons, {
                        columns: 1,
                    }).reply_markup
                );
                return;
            }

            const msgText = WithdrawTextSource.getApproveWithdrawRequestText(
                addressToWithdraw,
                collateralCurrency.symbol
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
            const msgText = WithdrawTextSource.getRejectWithdrawRequestText();

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
