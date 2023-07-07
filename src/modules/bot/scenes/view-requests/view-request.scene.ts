import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import { MainScene } from "../main.scene";
import { BotCommonService } from "../../bot-common.service";
import { DefaultSessionState, ExtendedSessionData, ExtendedWizardContext } from "../../bot.types";
import { SUPPORTED_TOKENS } from "../../constants";
import { CustomExceptionFilter } from "../../exception-filter";
import { ViewRequestText } from "./view-request.text";
import { BotManagerService } from "../../bot-manager.service";
import { SceneRequestTypes } from "./view-request.types";
import { getTxDataForRequest, getXLineRequestMsgData } from "../common/utils";
import { escapeSpecialCharacters } from "src/common";
import * as filters from "telegraf/filters";
import { Message } from "telegraf/typings/core/types/typegram";

enum ViewRequestSteps {
    CHOSE_COLLATERAL_TYPE,
    CHOSE_REQUEST_TYPE,
    VIEW_REQUEST,
    VIEW_ALL_REQUESTS,
}
enum ViewRequestCallbacks {
    REQUEST_TYPE = "chooseReqType",
    CREDIT_LINE_TYPE = "choseCreditLineType",
    VIEW_ALL = "viewAll",
    BACK_TO_MAIN_MENU = "back",
}
type ViewRequestSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        requestType?: SceneRequestTypes;
        collateralType?: SUPPORTED_TOKENS;
        debtType?: SUPPORTED_TOKENS; // For future use
        creditLineId?: string;
    };
};

type ViewRequestContext = ExtendedWizardContext<ViewRequestSessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(ViewRequestWizard.ID)
export class ViewRequestWizard {
    public static readonly ID = "VIEW_REQUEST_WIZARD";

    constructor(
        private readonly botCommon: BotCommonService,
        private readonly botManagerService: BotManagerService
    ) {}

    @WizardStep(ViewRequestSteps.CHOSE_COLLATERAL_TYPE)
    async onChoseCollateralType(@Ctx() ctx: ViewRequestContext) {
        let msgText = escapeSpecialCharacters("💰 Chose your credit line\n\n");

        const usersCLs = await this.botManagerService.getUserCreditLinesCurrencyExtended(ctx.from!.id);

        const buttons = [];
        for (const cl of usersCLs) {
            buttons.push({
                text: `${cl.collateralCurrency.symbol} / ${cl.debtCurrency.symbol}`,
                callback_data: `${ViewRequestCallbacks.CREDIT_LINE_TYPE}:${cl.collateralCurrency.symbol}_${cl.debtCurrency.symbol}`,
            });
        }

        if (buttons.length === 0) {
            msgText = escapeSpecialCharacters(
                "🤷 You don't have any credit lines.\n" +
                    "🆕 You can create a new one from the main menu interface\n\n"
            );
        }

        buttons.push(this.botCommon.goBackButton());

        await ctx.editMessageText(msgText, {
            parse_mode: "MarkdownV2",
        });

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(buttons, {
                columns: 1,
            }).reply_markup
        );

        ctx.wizard.next();
    }

    @WizardStep(ViewRequestSteps.CHOSE_REQUEST_TYPE)
    async onChoseRequestType(@Ctx() ctx: ViewRequestContext) {
        await ctx.editMessageText(
            escapeSpecialCharacters("📋 Choose the request type you want to see" + "\n" + "\n"),
            {
                parse_mode: "MarkdownV2",
            }
        );

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(
                [
                    {
                        text: "Deposit",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${SceneRequestTypes.DEPOSIT}`,
                    },
                    {
                        text: "Withdraw",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${SceneRequestTypes.WITHDRAW}`,
                    },
                    {
                        text: "Borrow",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${SceneRequestTypes.BORROW}`,
                    },
                    {
                        text: "Repay",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${SceneRequestTypes.REPAY}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                { columns: 1 }
            ).reply_markup
        );

        ctx.wizard.next();
    }

    @WizardStep(ViewRequestSteps.VIEW_REQUEST)
    async onViewRequest(@Ctx() ctx: ViewRequestContext) {
        const requestType = ctx.scene.session.state.requestType!;
        const collateralType = ctx.scene.session.state.collateralType;
        const chat_id = ctx.chat?.id;
        const creditLine = await this.botManagerService.getCreditLineByChatIdAndColSymbol(
            Number(chat_id),
            collateralType!
        );

        if (!creditLine) {
            throw new Error(
                `Credit line not found for chat_id: ${chat_id} and collateralType: ${collateralType}`
            );
        }

        const request = await this.botManagerService.getLatestRequestByType(requestType, creditLine?.id);

        let msgText = escapeSpecialCharacters(
            `🤷 You don't have ${requestType} requests.\n\n` +
                `🆕 You can create a new one from the main menu interface`
        );
        const buttons = [];

        if (request) {
            const requestMsgData = getXLineRequestMsgData(request);
            const associatedTxsData = getTxDataForRequest(request);

            msgText = ViewRequestText.getRequestMsgText(requestMsgData, requestType, associatedTxsData);
            buttons.push({
                text: `View all ${requestType} request`,
                callback_data: `${ViewRequestCallbacks.VIEW_ALL}:${requestType}`,
            });
        }

        await ctx.editMessageText(msgText, { parse_mode: "MarkdownV2" });

        buttons.push(this.botCommon.goBackButton());

        await ctx.editMessageReplyMarkup(Markup.inlineKeyboard(buttons, { columns: 1 }).reply_markup);
        ctx.wizard.next();
    }

    @WizardStep(ViewRequestSteps.VIEW_ALL_REQUESTS)
    async onViewAllRequests(@Ctx() ctx: ViewRequestContext) {
        const requestType = ctx.scene.session.state.requestType!;
        const collateralType = ctx.scene.session.state.collateralType;
        const chat_id = ctx.chat?.id;
        const creditLine = await this.botManagerService.getCreditLineByChatIdAndColSymbol(
            Number(chat_id),
            collateralType!
        );

        if (!creditLine) {
            throw new Error(
                `Credit line not found for chat_id: ${chat_id} and collateralType: ${collateralType}`
            );
        }

        const clId = creditLine?.id;

        const requests = await this.botManagerService.getAllFullyAssociatedReqByTypeAndCLId(
            requestType,
            clId
        );

        if (!requests || requests.length === 0) {
            throw new Error(`Requests not found for credit line id: ${clId}`);
        }

        const msgs = [];

        for (const req of requests) {
            const data = getXLineRequestMsgData(req);
            const associatedTxsData = getTxDataForRequest(req);

            const msgText = ViewRequestText.getRequestMsgText(data, requestType, associatedTxsData);

            if (requests.indexOf(req) === 0) {
                const firstMsg = (await ctx.editMessageText(msgText, {
                    parse_mode: "MarkdownV2",
                })) as Message;

                if (requests.length === 1) {
                    await ctx.editMessageReplyMarkup(
                        Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 })
                            .reply_markup
                    );
                    break;
                }
                msgs.push(firstMsg);
                continue;
            }

            let msg;
            if (requests.indexOf(req) === requests.length - 1) {
                msg = await ctx.replyWithMarkdownV2(msgText);

                await ctx.telegram.editMessageReplyMarkup(
                    ctx.chat?.id,
                    msg.message_id,
                    undefined,
                    Markup.inlineKeyboard([this.botCommon.goBackButton()], { columns: 1 }).reply_markup
                );
            } else {
                msg = await ctx.replyWithMarkdownV2(msgText);
            }

            msgs.push(msg);
        }

        this.botCommon.tryToSaveSceneMessage(ctx, msgs);
    }

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: ViewRequestContext) {
        // Enter scene handler.
        if (ctx.scene.session.cursor == ViewRequestSteps.CHOSE_COLLATERAL_TYPE) {
            await this.botCommon.executeCurrentStep(ctx);
            return;
        }

        if (!ctx.has(callbackQuery("data"))) return;
        const [callBackTarget, value] = ctx.callbackQuery.data.split(":");

        switch (callBackTarget) {
            case ViewRequestCallbacks.REQUEST_TYPE:
                await this.requestTypeActionHandler(ctx, value);
                break;
            case ViewRequestCallbacks.CREDIT_LINE_TYPE:
                await this.creditLineTypeActionHandler(ctx, value);
                break;
            case ViewRequestCallbacks.VIEW_ALL:
                await this.botCommon.executeCurrentStep(ctx);
                break;
            case ViewRequestCallbacks.BACK_TO_MAIN_MENU:
                await this.botCommon.tryToDeleteMessages(ctx, true);
                await ctx.scene.enter(MainScene.ID);
                break;
            default:
                throw new Error(`Could not find handler for the ${callBackTarget} action`);
        }
    }

    @Hears(/.*/)
    async onMessageHandler(@Ctx() ctx: ViewRequestContext) {
        // Catch user input to remove it with step message
        if (!ctx.has(filters.message("text"))) return;
        // This scene does not provide for user input, just delete the message
        try {
            await ctx.deleteMessage(ctx.message.message_id);
        } catch {}
        // Redirect to main scene if user input is "/start"
        if (ctx.message.text === "/start") {
            await this.botCommon.tryToDeleteMessages(ctx, true);
            await ctx.scene.enter(MainScene.ID);
        }
    }

    private async creditLineTypeActionHandler(ctx: ViewRequestContext, callbackValue?: string) {
        if (!callbackValue) {
            throw new Error("Unexpected callback value");
        }

        const [collateralType, debtType] = callbackValue.split("_");

        if (!collateralType || !debtType || collateralType === debtType) {
            throw new Error("Unexpected collateral and debt type values provided");
        }

        ctx.scene.session.state.collateralType = collateralType as SUPPORTED_TOKENS;
        ctx.scene.session.state.debtType = debtType as SUPPORTED_TOKENS;

        await this.botCommon.executeCurrentStep(ctx);
    }

    private async requestTypeActionHandler(ctx: ViewRequestContext, callbackValue?: string) {
        if (
            !callbackValue ||
            !Object.values(SceneRequestTypes).includes(callbackValue as SceneRequestTypes)
        ) {
            throw new Error("Unexpected request type value");
        }
        ctx.scene.session.state.requestType = callbackValue as SceneRequestTypes;
        await this.botCommon.executeCurrentStep(ctx);
    }
}
