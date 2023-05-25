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
import { EconomicalParametersService } from "src/modules/economical-parameters/economical-parameters.service";
import { CurrencyService } from "src/modules/currency/currency.service";
import { bigintToFormattedPercent } from "src/common";

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
        private readonly economicalParametersService: EconomicalParametersService,
        private readonly currencyService: CurrencyService
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
                ],
                { columns: 1 }
            )
        );
        this.botCommon.tryToSaveSceneMessage(ctx, msg);
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.TERM_AND_CONDITION))
    async onTermAndCondition(@Ctx() ctx: MainSceneContext) {
        await ctx.editMessageText(
            "🍄 Fully trusted solution! \n" + "You give me money, I give you money"
        );

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                columns: 1,
            }).reply_markup
        );
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.CURRENT_RATES))
    async onCurrentRates(@Ctx() ctx: MainSceneContext) {
        const debtCurrencies = await this.currencyService.getAllDebtCurrency();
        const collateralCurrencies = await this.currencyService.getAllCollateralCurrency();

        let text = "📊 Currently the following rates applies: \n\n";
        text +=
            "‼️ *Rates below are for reference only and may differ from the values at the time of opening a credit line*\n\n";

        for (const dc of debtCurrencies) {
            for (const cc of collateralCurrencies) {
                const economicalParameters =
                    await this.economicalParametersService.getFreshEconomicalParams(dc.id, cc.id);
                text += `🪙 ` + cc.symbol + ` \\/ ` + dc.symbol + `\n`;
                text +=
                    `APR:                              ` +
                    bigintToFormattedPercent(economicalParameters.apr).replace(".", "\\.") +
                    `\\%\n`;
                text +=
                    `Collateral Factor:        ` +
                    bigintToFormattedPercent(economicalParameters.collateralFactor).replace(".", "\\.") +
                    `\\%\n`;
                text +=
                    `Liquidation Factor:     ` +
                    bigintToFormattedPercent(economicalParameters.liquidationFactor).replace(
                        ".",
                        "\\."
                    ) +
                    `\\%\n`;
                text +=
                    `Liquidation Fee:          ` +
                    bigintToFormattedPercent(economicalParameters.liquidationFee).replace(".", "\\.") +
                    `\\%\n`;
                text +=
                    dc.symbol +
                    ` Processing Fee:  ` +
                    bigintToFormattedPercent(economicalParameters.fiatProcessingFee).replace(
                        ".",
                        "\\."
                    ) +
                    `\\%\n`;
                text +=
                    cc.symbol +
                    ` Processing Fee:  ` +
                    bigintToFormattedPercent(economicalParameters.cryptoProcessingFee).replace(
                        ".",
                        "\\."
                    ) +
                    `\\%\n`;
                text += `\n`;
            }
        }

        await ctx.editMessageText(text, { parse_mode: "MarkdownV2" });

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
