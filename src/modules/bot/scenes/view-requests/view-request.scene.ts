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
import { XLineRequestsTypes } from "../common/types";
import { Message } from "telegraf/typings/core/types/typegram";

enum ViewRequestSteps {
    CHOSE_COLLATERAL_TYPE,
    CHOSE_REQUEST_TYPE,
    VIEW_REQUEST,
    VIEW_ALL_REQUESTS,
}
enum ViewRequestCallbacks {
    REQUEST_TYPE = "chooseReqType",
    COLLATERAL_TYPE = "choseCollateralType",
    VIEW_ALL = "viewAll",
    BACK_TO_MAIN_MENU = "back",
}
type ViewRequestSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        requestType?: SceneRequestTypes;
        collateralType?: SUPPORTED_TOKENS;
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
        const msg = (await ctx.editMessageText(`💰 Chose the collateral type\n\n`, {
            parse_mode: "MarkdownV2",
        })) as Message;

        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(
                [
                    {
                        text: "ETH",
                        callback_data: `${ViewRequestCallbacks.COLLATERAL_TYPE}:${SUPPORTED_TOKENS.ETH}`,
                    },
                    {
                        text: "BTC",
                        callback_data: `${ViewRequestCallbacks.COLLATERAL_TYPE}:${SUPPORTED_TOKENS.BTC}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                {
                    columns: 1,
                }
            ).reply_markup
        );

        ctx.scene.session.state.sceneEditMsgId = msg.message_id;
        ctx.wizard.next();
    }

    @WizardStep(ViewRequestSteps.CHOSE_REQUEST_TYPE)
    async onChoseRequestType(@Ctx() ctx: ViewRequestContext) {
        await ctx.editMessageText("📋 Choose the request type you want to see" + "\n" + "\n", {
            parse_mode: "MarkdownV2",
        });

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

        const request = await this.getLatestRequestByType(requestType, creditLine?.id);

        let msgText =
            `🤷 You don't have ${requestType} requests.\n\n` +
            `🆕 You can create a new one from the main menu interface`;
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

        await ctx.editMessageText(
            escapeSpecialCharacters(
                `📒 Here you go.\n` + `This is your last ${requestType} request data`
            ),
            { parse_mode: "MarkdownV2" }
        );

        buttons.push(this.botCommon.goBackButton());

        const mainMsg = await ctx.replyWithMarkdownV2(
            msgText,
            Markup.inlineKeyboard(buttons, { columns: 1 })
        );
        this.botCommon.tryToSaveSceneMessage(ctx, [mainMsg]);
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

        let requests: XLineRequestsTypes[] | null;

        switch (requestType) {
            case SceneRequestTypes.DEPOSIT:
                const tempDReq = await this.botManagerService.getAllDepositRequestsByCreditLineId(clId);
                requests = tempDReq
                    ? await Promise.all(
                          tempDReq[0].map(
                              async req =>
                                  await this.botManagerService.getFullyAssociatedDepositRequest(req.id)
                          )
                      )
                    : null;
                break;
            case SceneRequestTypes.WITHDRAW:
                const tempWReq = await this.botManagerService.getAllWithdrawRequestsByCreditLineId(clId);
                requests = tempWReq
                    ? await Promise.all(
                          tempWReq[0].map(
                              async req =>
                                  await this.botManagerService.getFullyAssociatedWithdrawRequest(req.id)
                          )
                      )
                    : null;
                break;
            case SceneRequestTypes.BORROW:
                const tempBReq = await this.botManagerService.getAllBorrowRequestsByCreditLineId(clId);
                requests = tempBReq
                    ? await Promise.all(
                          tempBReq[0].map(
                              async req =>
                                  await this.botManagerService.getFullyAssociatedBorrowRequest(req.id)
                          )
                      )
                    : null;
                break;
            case SceneRequestTypes.REPAY:
                const tempRReq = await this.botManagerService.getAllRepayRequestsByCreditLineId(clId);
                requests = tempRReq
                    ? await Promise.all(
                          tempRReq[0].map(
                              async req =>
                                  await this.botManagerService.getFullyAssociatedRepayRequest(req.id)
                          )
                      )
                    : null;
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _: never = requestType;
                throw new Error(`Request type ${requestType} is not supported`);
        }

        if (!requests) {
            throw new Error(`Requests not found for credit line id: ${clId}`);
        }

        const editMsgId = ctx.scene.session.state.sceneEditMsgId;

        const msgs = [];
        for (const req of requests) {
            const data = getXLineRequestMsgData(req);
            const associatedTxsData = getTxDataForRequest(req);

            const msgText = ViewRequestText.getRequestMsgText(data, requestType, associatedTxsData);

            if (requests.indexOf(req) === 0) {
                await ctx.telegram.editMessageText(ctx.chat?.id, editMsgId, undefined, msgText, {
                    parse_mode: "MarkdownV2",
                });
            } else {
                const msg = await ctx.replyWithMarkdownV2(msgText);
                msgs.push(msg);
            }
        }

        const introduceMsg = await ctx.replyWithMarkdownV2(
            escapeSpecialCharacters(
                `📒 Here you go.\n` + `\n` + `This are all your ${requestType} requests data`
            ),
            Markup.inlineKeyboard([this.botCommon.goBackButton()])
        );

        msgs.push(introduceMsg);
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
            case ViewRequestCallbacks.COLLATERAL_TYPE:
                await this.collateralTypeActionHandler(ctx, value);
                break;
            case ViewRequestCallbacks.VIEW_ALL:
                await this.botCommon.tryToDeleteMessages(ctx);
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
        this.botCommon.tryToSaveSceneMessage(ctx, ctx.message);
        await this.botCommon.tryToDeleteMessages(ctx);
        throw new Error("Unexpected user message received");
    }

    private async collateralTypeActionHandler(ctx: ViewRequestContext, callbackValue?: string) {
        if (
            !callbackValue &&
            !Object.values(SceneRequestTypes).includes(callbackValue as SceneRequestTypes)
        ) {
            throw new Error("Unexpected collateral type value");
        }
        ctx.scene.session.state.collateralType = callbackValue as SUPPORTED_TOKENS;
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async requestTypeActionHandler(ctx: ViewRequestContext, callbackValue?: string) {
        if (
            !callbackValue &&
            !Object.values(SceneRequestTypes).includes(callbackValue as SceneRequestTypes)
        ) {
            throw new Error("Unexpected request type value");
        }
        ctx.scene.session.state.requestType = callbackValue as SceneRequestTypes;
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async getLatestRequestByType(
        requestType: SceneRequestTypes,
        creditLineId: number
    ): Promise<XLineRequestsTypes | null> {
        let request: XLineRequestsTypes | null = null;
        switch (requestType) {
            case SceneRequestTypes.DEPOSIT:
                request = await this.botManagerService.getLatestFullyAssociatedDepositReq(creditLineId);
                break;
            case SceneRequestTypes.WITHDRAW:
                request = await this.botManagerService.getLatestFullyAssociatedWithdrawReq(creditLineId);
                break;
            case SceneRequestTypes.BORROW:
                request = await this.botManagerService.getLatestFullyAssociatedBorrowReq(creditLineId);
                break;
            case SceneRequestTypes.REPAY:
                request = await this.botManagerService.getLatestFullyAssociatedRepayReq(creditLineId);
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _: never = requestType;
                throw new Error(`Request type ${requestType} is not supported`);
        }
        return request;
    }
}
