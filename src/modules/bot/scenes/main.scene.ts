import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Scene, SceneEnter } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import { MAIN_MENU_OPTIONS } from "../constants";
import { NewCreditRequestWizard } from "./new-credit-request.scene";
import { ViewActiveCreditLineWizard } from "./view-active-line.scene";
import { ViewRequestWizard } from "./view-request.scene";
import { BotCommonService } from "../bot-common.service";
import { buildTypeExp } from "../helpers";
import { ExtendedSessionData, ExtendedWizardContext } from "../bot.types";
import { CustomExceptionFilter } from "../exception-filter";
import { ConfigService } from "@nestjs/config";

type GotoVariant = "newCreditRequest" | "viewActiveLine" | "viewRequest";

type MainSessionData = ExtendedSessionData;
type MainSceneContext = ExtendedWizardContext<MainSessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Scene(MainScene.ID)
export class MainScene {
    public static readonly ID = "MAIN";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly configService: ConfigService
    ) {}

    @SceneEnter()
    async onEnter(@Ctx() ctx: MainSceneContext) {
        try {
            // Used to delete initial '/start' command
            await this.botCommon.tryToDeleteMessages(ctx);
        } catch {}

        const msg = await ctx.reply(
            "Hello dear friend!",
            Markup.inlineKeyboard(
                [
                    {
                        text: "📑 Term and condition",
                        callback_data: MAIN_MENU_OPTIONS.TERM_AND_CONDITION,
                    },
                    {
                        text: "📊 Current rates",
                        callback_data: MAIN_MENU_OPTIONS.CURRENT_RATES,
                    },
                    {
                        text: "🆕 Create new credit request",
                        callback_data: `goto:${MAIN_MENU_OPTIONS.NEW_CREDIT_REQUEST}`,
                    },
                    {
                        text: "💳 View active credit lines",
                        callback_data: `goto:${MAIN_MENU_OPTIONS.VIEW_ACTIVE_LINE}`,
                    },
                    {
                        text: "🦈 View your requests",
                        callback_data: `goto:${MAIN_MENU_OPTIONS.VIEW_REQUEST}`,
                    },
                    {
                        text: "👩‍💼 Contact support",
                        callback_data: MAIN_MENU_OPTIONS.CONTACT_SUPPORT,
                    },
                ],
                { columns: 1 }
            )
        );
        this.botCommon.tryToSaveSceneMessage(ctx, msg);
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.CONTACT_SUPPORT))
    async onContactSupport(@Ctx() ctx: MainSceneContext) {
        const op = this.configService.get<string>("SUPPORT_USERNAME");
        const text =
            `Here is your Reference number (click to copy): \`${ctx.chat?.id}\`\n\n` +
            `Please send it to our [support](https://telegram.me/${op}) to get help\n`;

        await ctx.editMessageText(text, { parse_mode: "MarkdownV2" });

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                columns: 1,
            }).reply_markup
        );
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.TERM_AND_CONDITION))
    async onTermAndCondition(@Ctx() ctx: MainSceneContext) {
        await ctx.editMessageText(
            `Terms & conditions could be found on our [website](https://xline.riddec.com/terms)\n`,
            { parse_mode: "MarkdownV2" }
        );

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                columns: 1,
            }).reply_markup
        );
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.CURRENT_RATES))
    async onCurrentRates(@Ctx() ctx: MainSceneContext) {
        // TODO: get real data from the database
        await ctx.editMessageText(
            "🍤 Currently the following rate applies: \n" +
                "APR: 2% \n" +
                "APY: 0% \n" +
                "feeSource: Crypto collateral \n" +
                "LiquidationFee BTC: 6% \n" +
                "LiquidationFee ETH: 5% \n"
        );

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                columns: 1,
            }).reply_markup
        );
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.BACK_MAIN_MENU))
    async onGoBack(@Ctx() ctx: MainSceneContext) {
        await ctx.scene.enter(MainScene.ID);
    }

    @Action(/goto:.*/)
    async gotoButton(@Ctx() ctx: MainSceneContext) {
        if (!ctx.has(callbackQuery("data"))) return;
        const [, direction] = ctx.callbackQuery.data.split(":");
        if (!direction) return;

        const sceneIdMap: Record<GotoVariant, string> = {
            newCreditRequest: NewCreditRequestWizard.ID,
            viewActiveLine: ViewActiveCreditLineWizard.ID,
            viewRequest: ViewRequestWizard.ID,
        };

        const targetSceneId = sceneIdMap[direction as GotoVariant];
        if (!targetSceneId) return;

        await ctx.scene.enter(targetSceneId);
    }

    // Catch everything except `/start` command
    @Hears(/^(?!\/start$).*/)
    async onMessageHandler(@Ctx() ctx: MainSceneContext) {
        this.botCommon.tryToSaveSceneMessage(ctx, ctx.message);
        await this.botCommon.tryToDeleteMessages(ctx);

        throw new Error("Unexpected user message received");
    }
}
