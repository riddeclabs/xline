import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Scene, SceneEnter } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import { MAIN_MENU_OPTIONS } from "../constants";
import { NewCreditRequestWizard } from "./new-credit-request/new-credit-request.scene";
import { ViewActiveCreditLineWizard } from "./view-active-line.scene";
import { ViewRequestWizard } from "./view-requests/view-request.scene";
import { BotCommonService } from "../bot-common.service";
import { buildTypeExp } from "../helpers";
import { ExtendedSessionData, ExtendedWizardContext } from "../bot.types";
import { CustomExceptionFilter } from "../exception-filter";
import { bigintToFormattedPercent, escapeSpecialCharacters } from "src/common";
import { ConfigService } from "@nestjs/config";
import { ManagePortfolioWizard } from "./manage-portfolio.scene";
import { BotManagerService } from "../bot-manager.service";
import * as filters from "telegraf/filters";

type GotoVariant = "newCreditRequest" | "viewActiveLine" | "viewRequest" | "managePortfolio";

type MainSessionData = ExtendedSessionData;
type MainSceneContext = ExtendedWizardContext<MainSessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Scene(MainScene.ID)
export class MainScene {
    public static readonly ID = "MAIN";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly configService: ConfigService,
        private readonly botManagerService: BotManagerService
    ) {}

    @SceneEnter()
    async onEnter(@Ctx() ctx: MainSceneContext) {
        try {
            // Used to delete initial '/start' command
            await this.botCommon.tryToDeleteMessages(ctx);
        } catch {}
        this.botCommon.clearSceneDto(ctx);

        const msg = await ctx.replyWithMarkdownV2(
            this.botCommon.makeHeaderText("Main menu"),
            Markup.inlineKeyboard(
                [
                    {
                        text: "📑 Term and condition",
                        callback_data: MAIN_MENU_OPTIONS.TERM_AND_CONDITION,
                    },
                    {
                        text: "📊 Current rates info",
                        callback_data: MAIN_MENU_OPTIONS.CURRENT_RATES,
                    },
                    {
                        text: "💳 Manage my portfolio",
                        callback_data: `goto:${MAIN_MENU_OPTIONS.MANAGE_PORTFOLIO}`,
                    },
                    {
                        text: "👩‍💼 Contact support",
                        callback_data: MAIN_MENU_OPTIONS.CONTACT_SUPPORT,
                    },
                    {
                        text: "⚙️ How it works",
                        callback_data: MAIN_MENU_OPTIONS.HOW_IT_WORKS,
                    },
                ],
                { columns: 1 }
            )
        );
        this.botCommon.tryToSaveSceneMessage(ctx, msg);
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.HOW_IT_WORKS))
    async onHowItWorks(@Ctx() ctx: MainSceneContext) {
        const text =
            "*Choose Your Collateral*\n" +
            "Select Bitcoin (BTC) or Ethereum (ETH) as the collateral for your credit line.\n\n" +
            "*Provide your requisites*\n" +
            "You will be asked to provide the necessary data: your name and IBAN you want to receive money.\n\n" +
            "*Set Your Collateral Amount and choose utilization*\n" +
            "Select one of 3 initial risk strategies to utilize our collateral: LOW (50%), MEDIUM (60%), HIGH (80%)\n" +
            "Remember, higher utilization means a higher risk of liquidation.\n\n" +
            "*Send crypto and receive USD*\n" +
            "XLine will generate and provide you a wallet address, associated with your credit line.\n" +
            "After you transfer crypto to this wallet, you will receive USD, based on the utilization rate you choose.\n\n" +
            "*Monitor & Manage*\n" +
            "Keep track of your collateral value and utilization to avoid liquidation. Make adjustments as needed to maintain a healthy balance.\n\n" +
            "You could always check the statuses of your credit line and adjustment requests in the menu.\n";

        await ctx.editMessageText(escapeSpecialCharacters(text), { parse_mode: "MarkdownV2" });

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard([this.botCommon.goBackButton()], {
                columns: 1,
            }).reply_markup
        );
    }

    @Action(buildTypeExp(MAIN_MENU_OPTIONS.CONTACT_SUPPORT))
    async onContactSupport(@Ctx() ctx: MainSceneContext) {
        const op = this.configService.get<string>("SUPPORT_USERNAME");
        const text =
            escapeSpecialCharacters(`Here is your Reference number (click to copy):`) +
            ` \`${ctx.chat?.id}\`\n\n` +
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
        const debtCurrencies = await this.botManagerService.currencyService.getAllDebtCurrency();
        const collateralCurrencies =
            await this.botManagerService.currencyService.getAllCollateralCurrency();

        let text = "📊 Currently the following rates applies:\n\n";
        text +=
            "‼️ *Rates below are for reference only and may differ from the values at the time of opening a credit line*\n\n";

        for (const dc of debtCurrencies) {
            for (const cc of collateralCurrencies) {
                const economicalParameters =
                    await this.botManagerService.economicalParamsService.getFreshEconomicalParams(
                        cc.id,
                        dc.id
                    );
                // prettier-ignore
                text += `🪙 ${cc.symbol} / ${dc.symbol}\n`
                + `APR:                              ${bigintToFormattedPercent(economicalParameters.apr)}%\n`
                + `Collateral Factor:        ${bigintToFormattedPercent(economicalParameters.collateralFactor)}%\n`
                + `Liquidation Factor:     ${bigintToFormattedPercent(economicalParameters.liquidationFactor)}%\n`
                + `Liquidation Fee:          ${bigintToFormattedPercent(economicalParameters.liquidationFee)}%\n`
                + `${dc.symbol} Processing Fee:  ${bigintToFormattedPercent(economicalParameters.fiatProcessingFee)}%\n`
                + `${cc.symbol} Processing Fee:  ${bigintToFormattedPercent(economicalParameters.cryptoProcessingFee)}%\n\n`;
            }
        }

        await ctx.editMessageText(escapeSpecialCharacters(text), { parse_mode: "MarkdownV2" });

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
            managePortfolio: ManagePortfolioWizard.ID,
        };

        const targetSceneId = sceneIdMap[direction as GotoVariant];
        if (!targetSceneId) return;

        await ctx.scene.enter(targetSceneId);
    }

    // Catch everything except `/start` command
    @Hears(/.*/)
    async onMessageHandler(@Ctx() ctx: MainSceneContext) {
        // Catch user input to remove it with step message
        if (!ctx.has(filters.message("text"))) return;

        // This scene does not provide for user input, just delete the message
        try {
            await ctx.deleteMessage(ctx.message.message_id);
        } catch {}

        if (ctx.message.text === "/start") {
            await this.botCommon.tryToDeleteMessages(ctx, true);
            await ctx.scene.enter(MainScene.ID);
        }
    }
}
