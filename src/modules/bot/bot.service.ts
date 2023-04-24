import { Injectable, Logger } from "@nestjs/common";
import { Start, Update, Ctx, Action } from "nestjs-telegraf";
import { Markup, Context, Scenes } from "telegraf";
import { MAIN_MENU_OPTIONS, MAIN_MENU } from "./constants";
import { generateCBData, buildTypeExp } from "./helpers";
import { callbackQuery } from "telegraf/filters";
import { NewCreditRequestWizard } from "./scenes/new-credit-request.scene";

export const getMainMenuButtons = () => {
    console.log(MAIN_MENU.map(x => console.log(generateCBData(x))));
    return MAIN_MENU.map(button => ({
        text: button,
        callback_data: generateCBData(button), // FIXME: only button> what value?
    }));
};

export const goBackButton = (ctx: Context, type?: MAIN_MENU_OPTIONS, data?: unknown) => {
    return {
        text: "↩ Go to main menu",
        // FIXME why we need another type but not only `back` ?
        callback_data: generateCBData(type ?? MAIN_MENU_OPTIONS.back, data),
    };
};

export interface ExtendedContext extends Context {
    session: any;
}

type StartContext = Scenes.SceneContext;

type GotoVariant = "newCreditRequest";

@Update()
@Injectable()
export class BotService {
    private readonly logger = new Logger(BotService.name);

    @Start()
    async startCommand(ctx: StartContext) {
        console.log("START POINT BLYAT");

        this.tryToDeleteMessages(ctx);
        await ctx.reply(
            "Hello dear friend!",
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

    @Action(/goto:.*/)
    async gotoButton(@Ctx() ctx: StartContext) {
        console.log(" >>>>>>>>>>> GO TO HANDLER >>>>>>>>>>>>>>>");
        if (!ctx.has(callbackQuery("data"))) return; //??
        const [, direction] = ctx.callbackQuery.data.split(":");
        if (!direction) return;

        console.log({ direction });

        const sceneIdMap: Record<GotoVariant, string> = {
            newCreditRequest: NewCreditRequestWizard.ID,
        };
        const targetSceneId = sceneIdMap[direction as GotoVariant];
        if (!targetSceneId) return;

        await ctx.scene.enter(targetSceneId);
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.termAndCondition))
    async onLocaleButtonClick(@Ctx() ctx: ExtendedContext) {
        await ctx.editMessageText("Fully trusted solution! \n" + "You give me money, I give you money");

        console.log("goBackButton(ctx)", goBackButton(ctx));
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([goBackButton(ctx)], {
                columns: 1,
            }).reply_markup
        );
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.currentRates))
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

    // @Action(buildTypeExp(MAIN_MENU_OPTIONS.makeDeposit))
    // async onDeposit(@Ctx() ctx: ExtendedContext) {
    //     await ctx.editMessageText("Coming soon 🪙");
    //
    //     await ctx.editMessageReplyMarkup(
    //         Markup.inlineKeyboard([goBackButton(ctx)], {
    //             columns: 1,
    //         }).reply_markup
    //     );
    // }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.back))
    async onGoBack(@Ctx() ctx: ExtendedContext) {
        await this.tryToDeleteMessages(ctx);

        await ctx.reply(
            "Main menu",
            Markup.inlineKeyboard(
                [
                    {
                        text: "Term and condition  ",
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
