import { Injectable, UseFilters } from "@nestjs/common";
import * as filters from "telegraf/filters";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import axios from "axios";
import { MainScene } from "./main.scene";
import { BotCommonService } from "../bot-common.service";
import { SignApplicationOptions, SUPPORTED_TOKENS } from "../constants";
import { DefaultSessionState, ExtendedSessionData, ExtendedWizardContext } from "../bot.types";
import { CustomExceptionFilter } from "../exception-filter";

enum NewCreditRequestSteps {
    CHOOSE_COLLATERAL_TOKEN,
    ENTER_FIAT_AMOUNT,
    ENTER_IBAN,
    SIGN_APPLICATION,
}

enum NewCreditReqCallbacks {
    SUPPLY_CURRENCY = "supplyCurrency",
    SIGN_APPLICATION = "signApplication",
    BACK_TO_MAIN_MENU = "back",
}

type NewCreditRequestSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        collateralCurrency?: string;
        reqEurAmount?: number;
        iban?: string;
        cryptoCurrencyAmount?: number;
        apr?: number;
        liqFee?: number;
        colFac?: number;
        liqFac?: number;
    };
};
type NewCreditRequestContext = ExtendedWizardContext<NewCreditRequestSessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(NewCreditRequestWizard.ID)
export class NewCreditRequestWizard {
    public static readonly ID = "NEW_CREDIT_REQUEST_WIZARD";

    constructor(private readonly botCommon: BotCommonService) {}

    @WizardStep(NewCreditRequestSteps.CHOOSE_COLLATERAL_TOKEN)
    async onChooseCollateralToken(@Ctx() ctx: NewCreditRequestContext) {
        const msg = await ctx.reply(
            "💱 Choose the currency you want to use as collateral 🪙",
            Markup.inlineKeyboard(
                [
                    {
                        text: SUPPORTED_TOKENS.ETH,
                        callback_data: `${NewCreditReqCallbacks.SUPPLY_CURRENCY}:${SUPPORTED_TOKENS.ETH}`,
                    },
                    {
                        text: SUPPORTED_TOKENS.BTC,
                        callback_data: `${NewCreditReqCallbacks.SUPPLY_CURRENCY}:${SUPPORTED_TOKENS.BTC}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                {
                    columns: 1,
                }
            )
        );

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.ENTER_FIAT_AMOUNT)
    async enterFiatAmount(@Ctx() ctx: NewCreditRequestContext) {
        const msg = await ctx.reply(
            "💶 Please enter the EUR amount you want to get by fully trusted solution"
        );

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.ENTER_IBAN)
    async enterIban(@Ctx() ctx: NewCreditRequestContext) {
        const msg = await ctx.reply("💳 Enter the IBAN you want to receive credit funds on");

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(NewCreditRequestSteps.SIGN_APPLICATION)
    async signApplication(@Ctx() ctx: NewCreditRequestContext) {
        // TODO: get current rates from the database

        const msg = await ctx.reply(
            `🪓 Detailed information about the loan offer:\n` +
                `APR: ${12}%\n` +
                `LiqFee : ${6}%\n` +
                `Collateral  factor: ${80}$\n` +
                `Liquidation factor: ${80}$\n` +
                `Requested ETH Amount: ${ctx.scene.session.state.reqEurAmount}\n` +
                `Fiat amount will be send to IBAN: ${ctx.scene.session.state.iban}`,
            Markup.inlineKeyboard(
                [
                    {
                        text: "✅ Approve",
                        callback_data: `${NewCreditReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.APPROVE}`,
                    },
                    {
                        text: "❌ Disapprove",
                        callback_data: `${NewCreditReqCallbacks.SIGN_APPLICATION}:${SignApplicationOptions.DISAPPROVE}`,
                    },
                ],
                { columns: 1 }
            )
        );

        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @Action(/.*/)
    async sceneActionHandler(@Ctx() ctx: NewCreditRequestContext) {
        await this.botCommon.tryToDeleteMessages(ctx);

        // Enter scene handler.
        if (ctx.scene.session.cursor == NewCreditRequestSteps.CHOOSE_COLLATERAL_TOKEN) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case NewCreditReqCallbacks.SUPPLY_CURRENCY:
                await this.supplyActionHandler(ctx, value);
                break;
            case NewCreditReqCallbacks.SIGN_APPLICATION:
                const msg = await this.signApplicationHandler(ctx, value);
                this.botCommon.tryToSaveSceneMessage(ctx, msg);
                break;
            case NewCreditReqCallbacks.BACK_TO_MAIN_MENU:
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
            case NewCreditRequestSteps.ENTER_FIAT_AMOUNT:
                await this.enterFiatAmountHandler(ctx, userMessageText);
                break;
            case NewCreditRequestSteps.ENTER_IBAN:
                await this.enterIbanHandler(ctx, userMessageText);
                break;
            default:
                throw new Error("Could not find handler for the target message");
        }
    }

    private async signApplicationHandler(ctx: NewCreditRequestContext, callbackValue?: string) {
        // TODO: verify user input based on current scene step

        let msg;
        if (callbackValue === SignApplicationOptions.APPROVE) {
            const state = ctx.scene.session.state;
            // TODO: replace with real oracle handler
            const price = await this.getTokenPrice(ctx.scene.session.state.collateralCurrency);
            // TODO: get credit request processing timeout from the database
            const processingTimeout = 30;
            // TODO: call XGetWay instead
            const wallet = await this.getNewWallet();

            // TODO: save to the database new credit request before the user notification

            msg = await ctx.reply(
                `✅ Yahoo! You've accepted credit request! \n` +
                    `Send ETH to the address:  ${wallet} \n` +
                    "\n" +
                    `Min amount to send: ${state.reqEurAmount! / price} ${
                        ctx.scene.session.state.collateralCurrency
                    } \n` +
                    `EUR/${state.collateralCurrency!} price: ${price} \n` +
                    "\n" +
                    `⌛ Request will expire in ${processingTimeout} minutes. \n`,
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 })
            );
        } else if (callbackValue === SignApplicationOptions.DISAPPROVE) {
            msg = await ctx.reply(
                "❌ You've rejected credit request! \n" + "Maybe next time, who knows ⚖",
                Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 })
            );
        } else {
            throw new Error("Incorrect sign application option");
        }

        return msg;
    }

    private async supplyActionHandler(ctx: NewCreditRequestContext, callbackValue?: string) {
        // TODO: verify user input based on current scene step

        if (
            !callbackValue ||
            !Object.values(SUPPORTED_TOKENS).includes(callbackValue as SUPPORTED_TOKENS)
        )
            throw new Error("Incorrect collateral currency");

        ctx.scene.session.state.collateralCurrency = callbackValue;

        await this.botCommon.executeCurrentStep(ctx);
    }

    private async enterFiatAmountHandler(ctx: NewCreditRequestContext, userInput: string) {
        ctx.scene.session.state.reqEurAmount = Number(userInput);
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async enterIbanHandler(ctx: NewCreditRequestContext, userInput: string) {
        ctx.scene.session.state.iban = String(userInput);
        await this.botCommon.executeCurrentStep(ctx);
    }

    // FIXME: remove me after integrating final oracle solution
    private async getTokenPrice(currency: string | undefined) {
        const endpoint = "https://api1.binance.com/api/v3/ticker/price";

        let tokenPrice: number;
        try {
            const pair = currency === "ETH" ? "ETHEUR" : "BTCEUR";
            const params = {
                symbol: pair,
            };

            const response = await axios.get(endpoint, { params });

            tokenPrice = response.data.price;
        } catch (error) {
            throw error;
        }
        if (!tokenPrice) {
            throw new Error("Get incorrect token price from oracle!");
        }

        return tokenPrice;
    }

    // FIXME: remove me after integrating XGetWay handler
    private async getNewWallet() {
        return "0xYA_POCHTI_UVEREN_CHTO_ETO_NE_SCAM";
    }
}
