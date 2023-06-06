import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import { MainScene } from "./main.scene";
import { ExtendedWizardContext } from "../bot.types";
import { BotCommonService } from "../bot-common.service";
import { CustomExceptionFilter } from "../exception-filter";
import { NewCreditRequestWizard } from "./new-credit-request/new-credit-request.scene";
import { ManageCreditLineWizard } from "./manage-credit-line/manage-credit-line.scene";

enum ManagePortfolioSteps {
    PORTFOLIO_MENU,
}

enum ManagePortfolioCallbacks {
    PORTFOLIO_ACTIONS = "portfolioActions",
    BACK_TO_MAIN_MENU = "back",
}

enum PortfolioActions {
    OPEN_NEW_LINE = "openNewLine",
    MANAGE_EXISTING_LINES = "manageExistingLines",
}

type ManagePortfolioContext = ExtendedWizardContext;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(ManagePortfolioWizard.ID)
export class ManagePortfolioWizard {
    public static readonly ID = "MANAGE_PORTFOLIO_WIZARD";

    constructor(private readonly botCommon: BotCommonService) {}

    @WizardStep(ManagePortfolioSteps.PORTFOLIO_MENU)
    async onWalletRequest(@Ctx() ctx: ManagePortfolioContext) {
        await ctx.editMessageText(this.botCommon.makeHeaderText("Portfolio actions"), {
            parse_mode: "MarkdownV2",
        });

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(
                [
                    {
                        text: "🆕 Open new credit line",
                        callback_data: `${ManagePortfolioCallbacks.PORTFOLIO_ACTIONS}:${PortfolioActions.OPEN_NEW_LINE}`,
                    },
                    {
                        text: "📤 Manage existing lines",
                        callback_data: `${ManagePortfolioCallbacks.PORTFOLIO_ACTIONS}:${PortfolioActions.MANAGE_EXISTING_LINES}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                {
                    columns: 1,
                }
            ).reply_markup
        );
        ctx.wizard.next();
    }

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: ManagePortfolioContext) {
        // Enter scene handler.
        if (ctx.scene.session.cursor == ManagePortfolioSteps.PORTFOLIO_MENU) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case ManagePortfolioCallbacks.PORTFOLIO_ACTIONS:
                await this.chosePortfolioActionHandler(ctx, value);
                break;
            case ManagePortfolioCallbacks.BACK_TO_MAIN_MENU:
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error("Could not find handler for the target action");
        }
    }

    private async chosePortfolioActionHandler(ctx: ManagePortfolioContext, callbackValue?: string) {
        if (callbackValue === PortfolioActions.OPEN_NEW_LINE) {
            await ctx.scene.enter(NewCreditRequestWizard.ID);
        } else if (callbackValue === PortfolioActions.MANAGE_EXISTING_LINES) {
            //FIXME: add separate scene for manage existing lines action
            await ctx.scene.enter(ManageCreditLineWizard.ID);
        } else throw new Error("Incorrect credit line action");
    }
}
