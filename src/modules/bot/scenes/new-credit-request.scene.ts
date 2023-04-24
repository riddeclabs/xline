import { Injectable } from "@nestjs/common";
import * as filters from "telegraf/filters";

import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup, MiddlewareFn, MiddlewareObj, Scenes } from "telegraf";
import { WizardSessionData } from "telegraf/typings/scenes";
import { goBackButton } from "../bot.service";
import { buildTypeExp } from "../helpers";
import { MAIN_MENU_OPTIONS } from "../constants";
import { callbackQuery } from "telegraf/filters";
import axios from "axios";

enum TermSteps {
    CHOOSE_COLLATERAL_TOKEN,
    ENTER_FIAT_AMOUNT,
    ENTER_IBAN,
    SIGN_APPLICATION,
}

type ExchangeSessionData = WizardSessionData & {
    state: {
        chat_id?: string;
        sceneMessageIds: number[];
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
type NewCreditRequestContext = Scenes.WizardContext<ExchangeSessionData>;

// async function executeNextStep<C extends NewCreditRequestContext>(ctx: C) {
//     console.log("⏭⏭⏭ Try to execute next step ⏭⏭⏭");
//     ctx.wizard.next();
//     await executeCurrentStep(ctx);
// }

async function executeCurrentStep<C extends NewCreditRequestContext>(ctx: C) {
    console.log("🐸🐸🐸~~~~~~~~~~~ Try to execute current step~~~~~~~~~~~~START~~~~~~~~~~~~ 🐸🐸🐸");

    const step = ctx.wizard.step;
    if (!step) return;

    const stepFn =
        typeof ctx.wizard.step === "function"
            ? (step as MiddlewareFn<C>)
            : (step as MiddlewareObj<C>).middleware();
    await stepFn(ctx, () => Promise.resolve());
    console.log("🐸🐸🐸~~~~~~~~~~~ Try to execute current step~~~~~~~~~~~~FINISH~~~~~~~~~~~~ 🐸🐸🐸");
}

@Injectable()
@Wizard(NewCreditRequestWizard.ID)
export class NewCreditRequestWizard {
    public static readonly ID = "NEW_CREDIT_REQUEST_WIZARD";

    @WizardStep(TermSteps.CHOOSE_COLLATERAL_TOKEN)
    async chooseCollateralToken(@Ctx() ctx: NewCreditRequestContext) {
        console.log(
            "🍋🍋🍋🍋 <<<<<<<<<< HELLO. I AM INSIDE THE chooseCollateralToken OF NEW CREDIT REQUEST SCENE >>>>>>>"
        );

        this.logContext(ctx);

        await ctx.reply(
            "💱 Choose the currency you want to use as collateral 🪙",
            Markup.inlineKeyboard(
                [
                    {
                        text: "ETH",
                        callback_data: "supplyCurrency:eth",
                    },
                    {
                        text: "BTC",
                        callback_data: "supplyCurrency:btc",
                    },
                    goBackButton(ctx),
                ],
                {
                    columns: 1,
                }
            )
        );
        ctx.wizard.next();
    }

    @Action(/.*/)
    async sceneActionHandler(@Ctx() ctx: NewCreditRequestContext) {
        console.log(
            "🍄🍄🍄🍄🍄 <<<<<<<<<< HELLO. I AM INSIDE THE sceneActionHandler POINT OF NEW CREDIT REQUEST SCENE >>>>>>>"
        );

        console.log("ctx.updates:", await ctx.telegram.getUpdates(100, 100, 0, undefined));
        console.log("Scene state:", ctx.scene.session.state);
        console.log("Scene messages:", ctx.scene.session.state.sceneMessageIds);
        this.logContext(ctx);

        await this.tryToDeleteMessages(ctx);

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        const state = ctx.scene.session.state;
        console.log("State before (ctx.scene.session.state):", ctx.scene.session.state);

        let msg;

        switch (callBackTarget) {
            case "supplyCurrency":
                console.log("🥕 Case supplyCurrency");

                if (value === "eth") {
                    state.collateralCurrency = "ETH";
                } else {
                    state.collateralCurrency = "BTC";
                }

                await executeCurrentStep(ctx);

                break;
            // handlerSupplyCurrencyStep
            case "signApplication":
                console.log("🥕 Case signApplication");

                if (value === "approved") {
                    const price = await this.calculateCollateralAmount(
                        ctx.scene.session.state.reqEurAmount!,
                        ctx.scene.session.state.collateralCurrency!
                    );
                    const wallet = await this.getNewWallet(ctx.scene.session.state.collateralCurrency!);

                    msg = await ctx.reply(
                        `✅ Yahoo! You've accepted credit request! \n` +
                            `Send ETH to the address:  ${wallet} \n` +
                            "\n" +
                            `Min amount to send: ${ctx.scene.session.state.reqEurAmount! / price} ${
                                ctx.scene.session.state.collateralCurrency
                            } \n` +
                            `EUR/${ctx.scene.session.state.collateralCurrency!} price: ${price} \n` +
                            "\n" +
                            `⌛Request will expire in ${30} secunds. \n`,

                        Markup.inlineKeyboard([goBackButton(ctx)], { columns: 1 })
                    );

                    setTimeout(
                        async (ctx: NewCreditRequestContext) => {
                            const msg = await ctx.reply(
                                "Time for the request has expired" +
                                    "We haven't get collateral funds from you.",
                                Markup.inlineKeyboard([
                                    {
                                        text: "OK",
                                        callback_data: "notification:requestRejected",
                                    },
                                ])
                            );

                            setTimeout(
                                (msg, ctx: NewCreditRequestContext) => {
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    ctx.deleteMessage(msg.message_id!);
                                },
                                3000,
                                msg,
                                ctx
                            );
                        },
                        30000,
                        ctx
                    );
                } else {
                    msg = await ctx.reply(
                        "❌ You've rejected credit request! \n" + "Maybe next time, who knows ⚖",
                        Markup.inlineKeyboard([goBackButton(ctx)], { columns: 1 })
                    );
                }
                ctx.scene.session.state.sceneMessageIds.push(msg.message_id);
                await ctx.scene.leave();

                break;
            default:
                await this.tryToDeleteMessages(ctx);

                if (ctx.scene.session.cursor == TermSteps.CHOOSE_COLLATERAL_TOKEN) {
                    await executeCurrentStep(ctx);
                    ctx.scene.session.state.sceneMessageIds = [];

                    break;
                }

                console.log("🍅🍅🍅 Could not find handler for target ACTION 🍅🍅🍅");

                msg = await ctx.reply(
                    "Something went wrong. Try to start deposit prose from scratch 🪙",
                    Markup.inlineKeyboard([goBackButton(ctx)], { columns: 1 })
                );

                if (ctx.scene.session.state.sceneMessageIds !== undefined)
                    ctx.scene.session.state.sceneMessageIds.push(msg.message_id);

                await ctx.scene.leave();
                break;
        }

        console.log("State after  (ctx.scene.session.state):", ctx.scene.session.state);
    }

    @Hears(/.*/)
    async userMessageHandler(@Ctx() ctx: NewCreditRequestContext) {
        console.log(
            "🍆🍆🍆🍆<<<<<<<<<< HELLO. I AM INSIDE THE userMessageHandler POINT OF NEW CREDIT REQUEST SCENE >>>>>>>"
        );

        this.logContext(ctx);

        if (!ctx.has(filters.message("text"))) return;

        if (ctx.scene.session.state.sceneMessageIds !== undefined)
            ctx.scene.session.state.sceneMessageIds.push(ctx.message.message_id);

        console.log("Scene state:", ctx.scene.session.state);
        console.log("Scene messages:", ctx.scene.session.state.sceneMessageIds);

        await this.tryToDeleteMessages(ctx);

        const userMessageText = ctx.message.text;
        const currentCursor = ctx.scene.session.cursor;

        const state = ctx.scene.session.state;
        console.log("State before (ctx.scene.session.state)", ctx.scene.session.state);

        switch (currentCursor) {
            case TermSteps.ENTER_FIAT_AMOUNT + 1:
                console.log("🥕 Case ENTER_FIAT_AMOUNT");
                state.reqEurAmount = Number(userMessageText);
                await executeCurrentStep(ctx);
                break;
            case TermSteps.ENTER_IBAN + 1:
                console.log("🥕 Case ENTER_IBAN");
                state.iban = String(userMessageText);
                await executeCurrentStep(ctx);
                break;
            default:
                console.log("🍅🍅🍅 Could not find handler for target MESSAGE 🍅🍅🍅");

                await this.tryToDeleteMessages(ctx);
                await ctx.reply(
                    "Something went wrong. Try to start deposit prose from scratch 🪙",
                    Markup.inlineKeyboard([goBackButton(ctx)], { columns: 1 })
                );

                await ctx.scene.leave();
        }
    }

    @WizardStep(TermSteps.ENTER_FIAT_AMOUNT)
    async enterFiatAmount(@Ctx() ctx: NewCreditRequestContext) {
        console.log(
            "🍋🍋🍋<<<<<<<<<< HELLO. I AM INSIDE THE enterFiatAmount POINT OF NEW CREDIT REQUEST SCENE >>>>>>>"
        );

        this.logContext(ctx);

        const msg = await ctx.reply(
            "💶 Please enter the EUR amount you want to get by fully trusted solution"
        );

        ctx.scene.session.state.sceneMessageIds.push(msg.message_id);

        ctx.wizard.next();
    }

    @WizardStep(TermSteps.ENTER_IBAN)
    async enterIban(@Ctx() ctx: NewCreditRequestContext) {
        console.log(
            "🍋🍋🍋<<<<<<<<<< HELLO. I AM INSIDE THE enterIban POINT OF NEW CREDIT REQUEST SCENE >>>>>>>"
        );

        this.logContext(ctx);

        const msg = await ctx.reply("💳 Enter your IBAN you want to receive credit funds");
        ctx.scene.session.state.sceneMessageIds.push(msg.message_id);

        ctx.wizard.next();
    }

    @WizardStep(TermSteps.SIGN_APPLICATION)
    async signApplication(@Ctx() ctx: NewCreditRequestContext) {
        console.log(
            "🍋🍋🍋<<<<<<<<<< HELLO. I AM INSIDE THE signApplication POINT OF NEW CREDIT REQUEST SCENE >>>>>>>"
        );

        this.logContext(ctx);

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
                        callback_data: "signApplication:approved",
                    },
                    {
                        text: "❌ Disapprove",
                        callback_data: "signApplication:disapprove",
                    },
                ],
                { columns: 1 }
            )
        );

        ctx.scene.session.state.sceneMessageIds.push(msg.message_id);
        ctx.wizard.next();
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.back))
    async onGoBack(@Ctx() ctx: NewCreditRequestContext) {
        console.log("<<<<<<<<<< HELLO. I AM INSIDE THE BACK POINT OF NEW CREDIT REQUEST SCENE >>>>>>>");

        this.logContext(ctx);

        await this.tryToDeleteMessages(ctx);

        await ctx.scene.leave();

        await ctx.reply(
            "Main menu",
            Markup.inlineKeyboard(
                [
                    {
                        text: "Term and condition",
                        callback_data: MAIN_MENU_OPTIONS.termAndCondition,
                    },
                    {
                        text: "Current rates",
                        callback_data: MAIN_MENU_OPTIONS.termAndCondition,
                    },
                    {
                        text: "Create new credit request",
                        callback_data: "goto:newCreditRequest",
                    },
                ],
                { columns: 1 }
            )
        );
    }

    private async tryToDeleteMessages(@Ctx() ctx: NewCreditRequestContext) {
        console.log("🌎🌎🌎 DEBUG --------------------tryToDeleteMessages-------START-------- 🌎🌎🌎");

        this.logContext(ctx);

        const allMessageIds = ctx.scene.session.state.sceneMessageIds;
        console.log("allMessageIds:", allMessageIds);

        if (allMessageIds && allMessageIds.length) {
            try {
                await Promise.all(
                    allMessageIds.map((message_id: number) => {
                        console.log("Message was deleted:", message_id);
                        return ctx.deleteMessage(message_id);
                    })
                );
            } catch (e) {
                // in case target message was deleted previously
            }

            console.log("All messages has been deleted");
            ctx.scene.session.state.sceneMessageIds = [];
        }

        console.log("Try to ctx.deleteMessage()");
        try {
            await ctx.deleteMessage();
        } catch (e) {
            console.log("Have problem with  'await ctx.deleteMessage()' ");
        }

        console.log("🌎🌎🌎 DEBUG --------------------tryToDeleteMessages-------FINISH-------- 🌎🌎🌎");
    }

    private async calculateCollateralAmount(amountEUR: number, currency: string) {
        const endpoint = "https://api1.binance.com/api/v3/ticker/price";
        try {
            const pair = currency === "ETH" ? "ETHEUR" : "BTCEUR";
            const params = {
                symbol: pair,
            };

            const response = await axios.get(endpoint, { params });
            const pairPrice = response.data;

            console.log({ response });
            console.log("Currency price:", pairPrice.price);

            return pairPrice.price;
        } catch (error) {
            // Handle API errors
            console.error(error);
            throw error;
        }
    }

    private async getNewWallet(currency: string) {
        return "0xYA_POCHTI_UVEREN_CHTO_ETO_NE_SCAM";
    }

    private logContext(ctx: NewCreditRequestContext) {
        console.log("🐽🐽🐽🐽 LOG CONTEXT 🐽🐽🐽");
        // console.log({ ctx });
        console.log("ctx.scene.session:", ctx.scene.session);
        console.log("ctx.ctx.scene.session.state", ctx.scene.session.state);
        console.log("allMessageIds:", ctx.scene.session.state.sceneMessageIds);
        console.log("ctx.session", ctx.session);
        console.log("ctx.wizard", ctx.wizard);
        console.log("🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽🐽");
    }
}
