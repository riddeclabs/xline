import { Injectable, UseFilters } from "@nestjs/common";
import * as filters from "telegraf/filters";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import { MainScene } from "../main.scene";
import { BotCommonService } from "../../bot-common.service";
import { SignApplicationOptions, SUPPORTED_TOKENS } from "../../constants";
import { CustomExceptionFilter } from "../../exception-filter";
import { BotManagerService } from "../../bot-manager.service";
import { formatUnitsNumber, parseUnits } from "../../../../common/fixed-number";
import { InlineKeyboardButton } from "typegram/markup";
import { NewCreditRequestText } from "./new-credit-request.text";
import {
    GET_DETAILS_CALLBACK,
    NewCreditReqCallbacks,
    NewCreditRequestContext,
    NewCreditRequestSteps,
    RiskStrategyLevels,
    SignApplicationSceneData,
} from "./new-credit-request.types";
import { validateIban, validateName } from "src/common/input-validation";
import { Message } from "telegraf/typings/core/types/typegram";
import { escapeSpecialCharacters } from "src/common";
import { ManageCreditLineWizard } from "../manage-credit-line/manage-credit-line.scene";
import { getRatesMsgData } from "../common/utils";

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(NewCreditRequestWizard.ID)
export class NewCreditRequestWizard {
    public static readonly ID = "NEW_CREDIT_REQUEST_WIZARD";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly botManager: BotManagerService
    ) {}

    @WizardStep(NewCreditRequestSteps.SIGN_GENERAL_TERMS)
    async onBasicInfo(@Ctx() ctx: NewCreditRequestContext) {
        const msg = (await ctx.editMessageText(NewCreditRequestText.getSignGeneralTermsMsg(), {
            parse_mode: "MarkdownV2",
        })) as Message;
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(
                [
                    {
                        text: "✅ OK",
                        callback_data: `${NewCreditReqCallbacks.GENERAL_TERMS}:${SignApplicationOptions.APPROVE}`,
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

    @WizardStep(NewCreditRequestSteps.CHOOSE_COLLATERAL_TOKEN)
    async onChooseCollateralToken(@Ctx() ctx: NewCreditRequestContext) {
        const collateralTokens = await this.botManager.getAllCollateralTokens();

        const buttons = collateralTokens.map(ct => {
            return {
                text: `💵 ${ct.symbol}`,
                callback_data: `${NewCreditReqCallbacks.SUPPLY_CURRENCY}:${ct.symbol}`,
            };
        });
        buttons.push(this.botCommon.goBackButton());

        await ctx.editMessageText(NewCreditRequestText.getChooseCollateralMsg(), {
            parse_mode: "MarkdownV2",
        });
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(buttons, {
                columns: 1,
            }).reply_markup
        );

        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.ENTER_IBAN)
    async enterIban(@Ctx() ctx: NewCreditRequestContext) {
        await ctx.editMessageText(NewCreditRequestText.getEnterIbanMsg(), {
            parse_mode: "MarkdownV2",
        });

        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.ENTER_ACCOUNT_NAME)
    async enterBankAccountName(@Ctx() ctx: NewCreditRequestContext) {
        await ctx.telegram.editMessageText(
            ctx.chat?.id,
            ctx.scene.session.state.sceneEditMsgId,
            undefined,
            NewCreditRequestText.getEnterBankAccountNameMsg(),
            { parse_mode: "MarkdownV2" }
        );

        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.ENTER_CRYPTO_AMOUNT)
    async enterCryptoAmount(@Ctx() ctx: NewCreditRequestContext) {
        await ctx.telegram.editMessageText(
            ctx.chat?.id,
            ctx.scene.session.state.sceneEditMsgId,
            undefined,
            NewCreditRequestText.getEnterCryptoAmountMsg(ctx),
            { parse_mode: "MarkdownV2" }
        );

        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.CHOSE_RISK_STRATEGY)
    async chooseRiskStrategy(@Ctx() ctx: NewCreditRequestContext) {
        const collateralTokenId = ctx.scene.session.state.collateralCurrency?.id;
        const debtTokenId = ctx.scene.session.state.debtCurrency?.id;

        if (!collateralTokenId || !debtTokenId) {
            throw new Error("Cannot find selected debt or collateral token");
        }

        const economicalParams = await this.botManager.getFreshEconomicalParams(
            collateralTokenId,
            debtTokenId
        );
        const convertedCF = formatUnitsNumber(economicalParams.collateralFactor);

        const editMsgId = ctx.scene.session.state.sceneEditMsgId;

        await ctx.telegram.editMessageText(
            ctx.chat?.id,
            editMsgId,
            undefined,
            NewCreditRequestText.getChoseRiskStrategyMsg(convertedCF),
            { parse_mode: "MarkdownV2" }
        );
        await ctx.telegram.editMessageReplyMarkup(
            ctx.chat?.id,
            editMsgId,
            undefined,
            Markup.inlineKeyboard(
                [
                    {
                        text: `🟢 LOW`,
                        callback_data: `${NewCreditReqCallbacks.RISK_STRATEGY}:${RiskStrategyLevels.LOW}`,
                    },
                    {
                        text: `🟠 MEDIUM`,
                        callback_data: `${NewCreditReqCallbacks.RISK_STRATEGY}:${RiskStrategyLevels.MEDIUM}`,
                    },
                    {
                        text: `🔴 HIGH`,
                        callback_data: `${NewCreditReqCallbacks.RISK_STRATEGY}:${convertedCF}`,
                    },
                ],
                { columns: 3 }
            ).reply_markup
        );

        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.SIGN_APPLICATION)
    async signApplication(@Ctx() ctx: NewCreditRequestContext, viewDetails = false) {
        const csss = ctx.scene.session.state;

        let userName = csss.bankAccountName;
        let userIban = csss.iban;
        if (!userName && !userIban) {
            const user = await this.botManager.getUserByChatId(ctx.chat!.id);
            const userPaymentRequisite = await this.botManager.getUserPaymentRequisiteByChatId(
                ctx.chat!.id
            );

            userName = user?.name;
            userIban = userPaymentRequisite?.iban;
        }

        const sceneData: SignApplicationSceneData = {
            colToken: csss.collateralCurrency!,
            debtToken: csss.debtCurrency!,
            depositAmount: csss.reqDepositAmountRaw!,
            riskStrategy: csss.riskStrategyLevel!,
            userName: userName!,
            userIban: userIban!,
        };

        if (Object.values(sceneData).includes(undefined)) {
            throw new Error("Incorrect scene state");
        }

        const economicalParameters = await this.botManager.getFreshEconomicalParams(
            sceneData.colToken.id,
            sceneData.debtToken.id
        );

        const openCreditLineData = await this.botManager.calculateOpenCreditLineData(
            sceneData.colToken.symbol,
            sceneData.colToken.decimals,
            parseUnits(sceneData.depositAmount, sceneData.colToken.decimals),
            parseUnits(sceneData.riskStrategy),
            economicalParameters
        );

        csss.economicalParamsId = economicalParameters.id;

        const buttonText = NewCreditRequestText.getSignApplicationButtonMsg();
        const buttons = [
            {
                text: "🧮 View calculation example",
                callback_data: `${NewCreditReqCallbacks.SIGN_APPLICATION}:${GET_DETAILS_CALLBACK}`,
            },
            {
                text: "✅ Approve",
                callback_data: `${NewCreditReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.APPROVE}`,
            },
            {
                text: "❌ Disapprove",
                callback_data: `${NewCreditReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.DISAPPROVE}`,
            },
        ];

        const ratesMsgData = getRatesMsgData(economicalParameters);

        if (!viewDetails) {
            const requisites = {
                iban: sceneData.userIban,
                accountName: sceneData.userName,
            };
            await ctx.editMessageText(
                NewCreditRequestText.getSignApplicationMainMsg(
                    ratesMsgData,
                    Number(sceneData.riskStrategy),
                    requisites
                ),
                { parse_mode: "MarkdownV2" }
            );

            const msg1 = await ctx.replyWithMarkdownV2(
                buttonText,
                Markup.inlineKeyboard(buttons, { columns: 1 })
            );

            this.botCommon.tryToSaveSceneMessage(ctx, msg1);
            this.botCommon.skipMessageRemoving(ctx, msg1);
        } else {
            // Remove `details` button from the button list
            buttons.shift();

            const detailsText = NewCreditRequestText.getSignApplicationDetailMsg(
                economicalParameters,
                openCreditLineData,
                sceneData,
                ratesMsgData
            );

            // Last sent message should be edited.
            // Note! Last sent msgId is not equal to sceneEditMsgId
            await ctx.editMessageText(detailsText + buttonText, { parse_mode: "MarkdownV2" });
            await ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard(buttons, { columns: 1 }).reply_markup
            );
        }

        ctx.wizard.next();
    }

    @Action(/.*/)
    async sceneActionHandler(@Ctx() ctx: NewCreditRequestContext) {
        // Enter scene handler.
        if (ctx.scene.session.cursor == NewCreditRequestSteps.SIGN_GENERAL_TERMS) {
            ctx.scene.session.state.debtCurrency = await this.botManager.getDebtTokenBySymbol("USD"); // Hardcoded until we support only USD
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        // Check if user has already registered, and we don't need to collect bank account data
        if (ctx.scene.session.cursor == NewCreditRequestSteps.ENTER_IBAN) {
            const paymentRequisite = await this.botManager.getUserPaymentRequisiteByChatId(ctx.chat!.id);
            if (paymentRequisite) {
                ctx.scene.session.cursor = NewCreditRequestSteps.ENTER_CRYPTO_AMOUNT;
            }
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case NewCreditReqCallbacks.GENERAL_TERMS:
                await this.generalTermHandler(ctx, value);
                break;
            case NewCreditReqCallbacks.SUPPLY_CURRENCY:
                await this.supplyActionHandler(ctx, value);
                break;
            case NewCreditReqCallbacks.RISK_STRATEGY:
                await this.riskStrategyHandler(ctx, value);
                break;
            case NewCreditReqCallbacks.SIGN_APPLICATION:
                await this.signApplicationHandler(ctx, value);
                break;
            case NewCreditReqCallbacks.RE_ENTER_CRYPTO_AMOUNT:
            case NewCreditReqCallbacks.RE_ENTER_NAME:
            case NewCreditReqCallbacks.RE_ENTER_IBAN:
                ctx.wizard.back();
                await this.botCommon.executeCurrentStep(ctx);
                break;
            case NewCreditReqCallbacks.VIEW_EXISTING_CREDIT_LINES:
                await ctx.scene.enter(ManageCreditLineWizard.ID);
                break;
            case NewCreditReqCallbacks.BACK_TO_MAIN_MENU:
                await this.botCommon.tryToDeleteMessages(ctx, true);
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
        try {
            await ctx.deleteMessage(ctx.message.message_id);
        } catch {}

        const userMessageText = ctx.message.text;
        const currentCursor = ctx.scene.session.cursor;

        // We should to substitute 1 from current cursor,
        // due to each scene handler moves the pointer to the next scene
        switch (currentCursor - 1) {
            case NewCreditRequestSteps.ENTER_ACCOUNT_NAME:
                await this.enterAccountNameHandler(ctx, userMessageText);
                break;
            case NewCreditRequestSteps.ENTER_CRYPTO_AMOUNT:
                await this.reqCryptoAmountHandler(ctx, userMessageText);
                break;
            case NewCreditRequestSteps.ENTER_IBAN:
                await this.enterIbanHandler(ctx, userMessageText);
                break;
            default:
                // Redirect to main scene if user input is "/start"
                if (ctx.message.text === "/start") {
                    await this.botCommon.tryToDeleteMessages(ctx, true);
                    await ctx.scene.enter(MainScene.ID);
                }
        }
    }

    private async generalTermHandler(ctx: NewCreditRequestContext, callbackValue?: string) {
        // For general terms we have only one possible callback option
        if (callbackValue === SignApplicationOptions.APPROVE) {
            await this.botCommon.executeCurrentStep(ctx);
        } else {
            throw new Error("Incorrect sign general terms option");
        }
    }

    private async supplyActionHandler(ctx: NewCreditRequestContext, callbackValue?: string) {
        if (!callbackValue) throw new Error("Incorrect collateral currency callback received");

        // Will fail if currency is not found
        const collateralCurrency = await this.botManager.getCollateralTokenBySymbol(callbackValue);

        const chatId = ctx.chat!.id;
        const cl = await this.botManager.getCreditLineByChatIdAndColSymbol(chatId, callbackValue);

        if (cl) {
            const errorMsg = NewCreditRequestText.getExistingCreditLineErrorMsg(callbackValue);
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
                            text: "📤 View existing lines",
                            callback_data: `${NewCreditReqCallbacks.VIEW_EXISTING_CREDIT_LINES}`,
                        },
                        this.botCommon.goBackButton(),
                    ],
                    { columns: 2 }
                ).reply_markup
            );
        } else {
            ctx.scene.session.state.collateralCurrency = collateralCurrency;
            await this.botCommon.executeCurrentStep(ctx);
        }
    }

    private async enterIbanHandler(ctx: NewCreditRequestContext, userInput: string) {
        const formattedInput = userInput.replace(/\s/g, "").toUpperCase();
        const ibanValidity = validateIban(formattedInput);

        if (!ibanValidity.valid) {
            const errorMsg = NewCreditRequestText.getIbanValidationErrorMsg(userInput);
            await this.botCommon.retryOrBackHandler(ctx, errorMsg, NewCreditReqCallbacks.RE_ENTER_NAME);
        } else {
            ctx.scene.session.state.iban = formattedInput;
            await this.botCommon.executeCurrentStep(ctx);
        }
    }

    private async enterAccountNameHandler(ctx: NewCreditRequestContext, userInput: string) {
        const input = userInput.toUpperCase();
        if (!validateName(input)) {
            const errorMsg = NewCreditRequestText.getNameValidationErrorMsg(userInput);
            await this.botCommon.retryOrBackHandler(ctx, errorMsg, NewCreditReqCallbacks.RE_ENTER_NAME);
        } else {
            ctx.scene.session.state.bankAccountName = input;
            await this.botCommon.executeCurrentStep(ctx);
        }
    }

    private async reqCryptoAmountHandler(ctx: NewCreditRequestContext, userInput: string) {
        const input = Number(userInput);
        if (!input || input <= 0) {
            const errorMsg = NewCreditRequestText.getAmountValidationErrorMsg(userInput);
            await this.botCommon.retryOrBackHandler(
                ctx,
                errorMsg,
                NewCreditReqCallbacks.RE_ENTER_CRYPTO_AMOUNT
            );
        } else {
            const decimalMaxLength = ctx.scene.session.state.collateralCurrency?.decimals;
            if (!decimalMaxLength) throw new Error("Could not find collateral currency decimals");

            // eslint-disable-next-line prefer-const
            let [integer, decimal] = userInput.split(".");

            if (decimal && decimal.length > decimalMaxLength) {
                decimal = decimal.slice(0, decimalMaxLength);
            } else {
                decimal = decimal || "0";
            }

            ctx.scene.session.state.reqDepositAmountRaw = integer + "." + decimal;
            await this.botCommon.executeCurrentStep(ctx);
        }
    }

    private async riskStrategyHandler(ctx: NewCreditRequestContext, callbackValue?: string) {
        if (!callbackValue) throw new Error("Incorrect risk strategy level");

        ctx.scene.session.state.riskStrategyLevel = callbackValue;
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async signApplicationHandler(ctx: NewCreditRequestContext, callbackValue?: string) {
        // TODO: verify user input based on current scene step
        const buttons: InlineKeyboardButton[] = [this.botCommon.goBackButton()];

        const csss = ctx.scene.session.state;
        if (
            !csss.debtCurrency ||
            !csss.collateralCurrency ||
            !csss.economicalParamsId ||
            !csss.riskStrategyLevel
        ) {
            throw new Error("Incorrect scene state");
        }

        if (callbackValue === GET_DETAILS_CALLBACK) {
            await ctx.wizard.back();
            await this.signApplication(ctx, true);
            return;
        } else {
            // Force unlock skipped message
            ctx.scene.session.state.skipMsgRemovingOnce = [];
        }

        const editMsgId = ctx.scene.session.state.sceneEditMsgId!;

        if (callbackValue === SignApplicationOptions.APPROVE) {
            const wallet = await this.botManager.getUserWallet(
                ctx.chat!.id.toString(),
                csss.collateralCurrency.symbol
            );

            // Save to the database new credit request before the user notification
            await this.botManager.finishNewCreditLine(
                ctx.chat!.id,
                csss.debtCurrency.id,
                csss.economicalParamsId,
                csss.collateralCurrency.id,
                parseUnits(csss.riskStrategyLevel),
                csss.iban,
                csss.bankAccountName
            );

            if (csss.collateralCurrency.symbol === SUPPORTED_TOKENS.ETH) {
                buttons.unshift(this.botCommon.getMetamaskWalletButton(wallet));
            }

            const replyMsgs = NewCreditRequestText.getSignApplicationHandlerMsg(callbackValue, wallet);
            if (typeof replyMsgs === "string") {
                throw new Error("Incorrect message structure");
            }

            // Remove all stored msgs except sceneEditMsgId directly before editing main msg to avoid interface lag
            await this.botCommon.tryToDeleteMessages(ctx);

            await ctx.telegram.editMessageText(ctx.chat!.id, editMsgId, undefined, replyMsgs.msg, {
                parse_mode: "MarkdownV2",
            });
            const msg1 = await ctx.replyWithPhoto(replyMsgs.msg1);
            const msg2 = await ctx.replyWithMarkdownV2(
                replyMsgs.msg2,
                Markup.inlineKeyboard(buttons, { columns: 1 })
            );

            this.botCommon.tryToSaveSceneMessage(ctx, [msg1, msg2]);
        } else if (callbackValue === SignApplicationOptions.DISAPPROVE) {
            const replyMsg = NewCreditRequestText.getSignApplicationHandlerMsg(callbackValue);
            if (!(typeof replyMsg === "string")) {
                throw new Error("Incorrect message structure");
            }

            // Remove all stored msgs except sceneEditMsgId directly before editing main msg to avoid interface lag
            await this.botCommon.tryToDeleteMessages(ctx);

            await ctx.telegram.editMessageText(ctx.chat?.id, editMsgId, undefined, replyMsg, {
                parse_mode: "MarkdownV2",
            });
            await ctx.telegram.editMessageReplyMarkup(
                ctx.chat?.id,
                editMsgId,
                undefined,
                Markup.inlineKeyboard(buttons, { columns: 1 }).reply_markup
            );
        } else {
            throw new Error("Incorrect sign application option");
        }
    }
}
