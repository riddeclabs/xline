import { Injectable, Logger } from "@nestjs/common";
import { Start, Update, Ctx, Action } from "nestjs-telegraf";
import { Markup, Context } from "telegraf";
import { EVENT_TYPES, MAIN_MENU } from "./constants";
import { generateCBData, buildTypeExp } from "./helpers";

const getMainMenuButtons = () => {
    console.log(MAIN_MENU.map(x => console.log(generateCBData(x))));
    return MAIN_MENU.map(button => ({
        text: button,
        callback_data: generateCBData(button), // FIXME: only button> what value?
    }));
};

const goBackButton = (ctx: Context, type?: EVENT_TYPES, data?: unknown) => {
    return {
        text: "Go to main menu",
        // FIXME why we need another type but not only `back` ?
        callback_data: generateCBData(type ?? EVENT_TYPES.back, data),
    };
};

export interface ExtendedContext extends Context {
    session: any;
}

@Update()
@Injectable()
export class BotService {
    private readonly logger = new Logger(BotService.name);

    @Start()
    async startCommand(ctx: ExtendedContext) {
        await ctx.reply(
            "Hello dear friend!",
            Markup.inlineKeyboard(getMainMenuButtons(), { columns: 1 })
        );
    }

    @Action(buildTypeExp(EVENT_TYPES.termAndCondition))
    async onLocaleButtonClick(@Ctx() ctx: ExtendedContext) {
        await ctx.editMessageText("Fully trusted solution! \n" + "You give me money, I give you money");

        console.log("goBackButton(ctx)", goBackButton(ctx));
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([goBackButton(ctx)], {
                columns: 1,
            }).reply_markup
        );
    }

    @Action(buildTypeExp(EVENT_TYPES.currentRates))
    async onRates(@Ctx() ctx: ExtendedContext) {
        await ctx.editMessageText(
            "APR: 2% \n" +
                "APY: 0% \n" +
                "feeSource: Crypto collateral \n" +
                "LiquidatonFee BTC: 6% \n" +
                "LiquidatonFee ETH: 5% \n"
        );

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([goBackButton(ctx)], {
                columns: 1,
            }).reply_markup
        );
    }
    @Action(buildTypeExp(EVENT_TYPES.makeDeposit))
    async onDeposit(@Ctx() ctx: ExtendedContext) {
        await ctx.editMessageText("Coming soon 🪙");

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([goBackButton(ctx)], {
                columns: 1,
            }).reply_markup
        );
    }

    @Action(buildTypeExp(EVENT_TYPES.back))
    async onGoBack(@Ctx() ctx: ExtendedContext) {
        console.log({ ctx });
        await this.tryToDeleteMessages(ctx);

        await ctx.reply("Main menu", Markup.inlineKeyboard(getMainMenuButtons(), { columns: 1 }));
    }

    private async tryToDeleteMessages(@Ctx() ctx: ExtendedContext) {
        if (ctx.session?.rmList?.length) {
            console.log("Hello i'm inside");
            try {
                await Promise.all(ctx.session.rmList.map((mid: number) => ctx.deleteMessage(mid)));
            } catch (e) {
                // in case target message was deleted previously
            }
            ctx.session.rmList = [];
        }

        try {
            await ctx.deleteMessage();
        } catch (e) {
            // in case target message was deleted previously
        }
    }
}
