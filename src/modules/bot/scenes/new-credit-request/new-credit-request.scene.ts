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

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(NewCreditRequestWizard.ID)
export class NewCreditRequestWizard {
    public static readonly ID = "NEW_CREDIT_REQUEST_WIZARD";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly botManager: BotManagerService,
        private readonly msgSource: NewCreditRequestText
    ) {}

    @WizardStep(NewCreditRequestSteps.SIGN_GENERAL_TERMS)
    async onBasicInfo(@Ctx() ctx: NewCreditRequestContext) {
        const msg = await ctx.replyWithMarkdownV2(
            this.msgSource.getSignGeneralTermsMsg(),
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
            )
        );

        this.botCommon.tryToSaveSceneMessage(ctx, [msg]);
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

        const msg = await this.botCommon.clearAndReply(
            ctx,
            this.msgSource.getChooseCollateralMsg(),
            true,
            { columns: 1 },
            buttons
        );

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.ENTER_IBAN)
    async enterIban(@Ctx() ctx: NewCreditRequestContext) {
        const msg = await this.botCommon.clearAndReply(ctx, this.msgSource.getEnterIbanMsg(), true);

        this.botCommon.tryToSaveSceneMessage(ctx, [msg]);
        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.ENTER_ACCOUNT_NAME)
    async enterBankAccountName(@Ctx() ctx: NewCreditRequestContext) {
        const msg = await this.botCommon.clearAndReply(
            ctx,
            this.msgSource.getEnterBankAccountNameMsg(),
            true
        );

        this.botCommon.tryToSaveSceneMessage(ctx, [msg]);
        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.ENTER_CRYPTO_AMOUNT)
    async enterCryptoAmount(@Ctx() ctx: NewCreditRequestContext) {
        const msg = await this.botCommon.clearAndReply(
            ctx,
            this.msgSource.getEnterCryptoAmountMsg(ctx),
            true
        );

        this.botCommon.tryToSaveSceneMessage(ctx, [msg]);
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

        const msg = await this.botCommon.clearAndReply(
            ctx,
            this.msgSource.getChoseRiskStrategyMsg(convertedCF),
            true,
            { columns: 3 },
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
            ]
        );

        this.botCommon.tryToSaveSceneMessage(ctx, [msg]);
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
            supplyAmount: csss.reqDepositAmountRaw!,
            riskStrategy: csss.riskStrategyLevel!,
            userName: userName!,
            userIban: userIban!,
        };

        if (Object.values(sceneData).includes(undefined)) {
            throw new Error("Incorrect scene state");
        }

        const { economicalParameters, openCreditLineData } = await this.botManager.getNewCreditDetails(
            sceneData
        );
        csss.economicalParamsId = economicalParameters.id;

        const msgs = [];
        const buttonText = this.msgSource.getSignApplicationButtonMsg();
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

        if (!viewDetails) {
            const msg1 = await this.botCommon.clearAndReply(
                ctx,
                this.msgSource.getSignApplicationMainMsg(economicalParameters, sceneData),
                true
            );
            const msg2 = await ctx.replyWithMarkdownV2(
                buttonText,
                Markup.inlineKeyboard(buttons, { columns: 1 })
            );

            msgs.push(msg1, msg2);
            this.botCommon.skipMessageRemoving(ctx, [msg1]);
        } else {
            // Remove `details` button from the button list
            buttons.shift();

            const detailsText = this.msgSource.getSignApplicationDetailMsg(
                economicalParameters,
                openCreditLineData,
                sceneData
            );
            const msg = await this.botCommon.clearAndReply(
                ctx,
                detailsText + buttonText,
                true,
                { columns: 1 },
                buttons
            );

            msgs.push(msg);
        }

        this.botCommon.tryToSaveSceneMessage(ctx, msgs);
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
            case NewCreditReqCallbacks.BACK_TO_MAIN_MENU:
                await this.botCommon.tryToDeleteMessages(ctx);
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
        this.botCommon.tryToSaveSceneMessage(ctx, ctx.message);
        await this.botCommon.tryToDeleteMessages(ctx);

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
                throw new Error("Could not find handler for the target message");
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

        ctx.scene.session.state.collateralCurrency = await this.botManager.getCollateralTokenBySymbol(
            callbackValue
        );

        await this.botCommon.executeCurrentStep(ctx);
    }

    private async enterIbanHandler(ctx: NewCreditRequestContext, userInput: string) {
        // FIXME: verify user input
        ctx.scene.session.state.iban = userInput.toUpperCase();
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async enterAccountNameHandler(ctx: NewCreditRequestContext, userInput: string) {
        // FIXME: verify user input
        ctx.scene.session.state.bankAccountName = userInput.toUpperCase();
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async reqCryptoAmountHandler(ctx: NewCreditRequestContext, userInput: string) {
        // FIXME: verify user input
        ctx.scene.session.state.reqDepositAmountRaw = userInput;
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async riskStrategyHandler(ctx: NewCreditRequestContext, callbackValue?: string) {
        if (!callbackValue) throw new Error("Incorrect risk strategy level");

        ctx.scene.session.state.riskStrategyLevel = callbackValue;
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async signApplicationHandler(ctx: NewCreditRequestContext, callbackValue?: string) {
        // TODO: verify user input based on current scene step
        const msgs = [];
        const buttons: InlineKeyboardButton[] = [this.botCommon.goBackButton()];

        const csss = ctx.scene.session.state;

        if (
            !csss.debtCurrency ||
            !csss.collateralCurrency ||
            // !csss.iban ||
            // !csss.bankAccountName ||
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
            ctx.scene.session.state.skipMsgRemovingOnce = [];
        }

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

            const replyMsgs = this.msgSource.getSignApplicationHandlerMsg(callbackValue, wallet);

            if (typeof replyMsgs === "string") {
                throw new Error("Incorrect message structure");
            }

            const msg = await this.botCommon.clearAndReply(ctx, replyMsgs.msg, true);
            const msg1 = await ctx.replyWithPhoto(replyMsgs.msg1);

            const msg2 = await ctx.replyWithMarkdownV2(
                replyMsgs.msg2,
                Markup.inlineKeyboard(buttons, { columns: 1 })
            );

            msgs.push(msg, msg1, msg2);
        } else if (callbackValue === SignApplicationOptions.DISAPPROVE) {
            const replyMsg = this.msgSource.getSignApplicationHandlerMsg(callbackValue);
            if (!(typeof replyMsg === "string")) {
                throw new Error("Incorrect message structure");
            }

            const rejectMsg = await this.botCommon.clearAndReply(
                ctx,
                replyMsg,
                true,
                { columns: 1 },
                buttons
            );
            msgs.push(rejectMsg);
        } else {
            throw new Error("Incorrect sign application option");
        }

        this.botCommon.tryToSaveSceneMessage(ctx, msgs);
    }
}
