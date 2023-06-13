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
import { RequestTypes, XLineRequestMsgData } from "./view-request.types";
import { CollateralCurrency } from "src/database/entities";
import { formatUnitsNumber } from "src/common";

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
        requestType?: RequestTypes;
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

    @WizardStep(ViewRequestSteps.CHOSE_REQUEST_TYPE)
    async onChoseRequestType(@Ctx() ctx: ViewRequestContext) {
        const msg = await ctx.reply(
            "📋 Choose the request type you want to see" + "\n" + "\n",
            Markup.inlineKeyboard(
                [
                    {
                        text: "Deposit",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${RequestTypes.DEPOSIT}`,
                    },
                    {
                        text: "Withdraw",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${RequestTypes.WITHDRAW}`,
                    },
                    {
                        text: "Borrow",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${RequestTypes.BORROW}`,
                    },
                    {
                        text: "Repay",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${RequestTypes.REPAY}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                { columns: 1 }
            )
        );
        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(ViewRequestSteps.CHOSE_COLLATERAL_TYPE)
    async onChoseCollateralType(@Ctx() ctx: ViewRequestContext) {
        const msg = await ctx.reply(
            `💰 Chose the collateral type\n\n`,
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
            )
        );
        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(ViewRequestSteps.VIEW_REQUEST)
    async onViewRequest(@Ctx() ctx: ViewRequestContext) {
        const requestType = ctx.scene.session.state.requestType;
        const collateralType = ctx.scene.session.state.collateralType;
        const chat_id = ctx.chat?.id;
        const creditLine = await this.botManagerService.getCreditLineByChatIdAndColSymbol(
            Number(chat_id),
            collateralType!
        );
        const clId = creditLine?.id!;
        const collateralCurrency = await this.botManagerService.getCollateralTokenBySymbol(
            collateralType as string
        );

        if (!creditLine) {
            throw new Error(
                `Credit line not found for chat_id: ${chat_id} and collateralType: ${collateralType}`
            );
        }

        const data = await this.getXLineRequestData(
            requestType!,
            clId,
            collateralType!,
            collateralCurrency
        );

        let msgText =
            `🤷 You don't have ${requestType} requests.\n\n` +
            `🆕 You can create a new one from the main menu interface`;

        const buttons = [];

        if (data) {
            msgText = ViewRequestText.getRequestMsgText(data, requestType!);
            buttons.push({
                text: `View all ${requestType} request`,
                callback_data: `${ViewRequestCallbacks.VIEW_ALL}:${requestType}`,
            });
        }

        const introduceMsg = await ctx.reply(
            `📒 Here you go.\n` + `This is your last ${requestType} request data`
        );

        buttons.push(this.botCommon.goBackButton());

        const mainMsg = await ctx.reply(msgText, Markup.inlineKeyboard(buttons, { columns: 1 }));
        this.botCommon.tryToSaveSceneMessage(ctx, [introduceMsg, mainMsg]);
        ctx.wizard.next();
    }
    /*
    @WizardStep(ViewRequestSteps.VIEW_ALL_REQUESTS)
    async onViewAllRequests(@Ctx() ctx: ViewRequestContext) {
        const requestType = ctx.scene.session.state.requestType;
        const collateralType = ctx.scene.session.state.collateralType;
        const chat_id = ctx.chat?.id;

        // TODO: get actual data from the database
        const allUserRequests = this.getAllUserRequests(chat_id, requestType, collateralType);

        const msgs = [];
        for (const req of allUserRequests) {
            const msgText = this.getMsgByRequestType(req, collateralType, requestType);

            const msg = await ctx.reply(msgText);
            msgs.push(msg);
        }

        const introduceMsg = await ctx.reply(
            `📒 Here you go.\n` + `\n` + `This are all your ${requestType} requests data`,
            Markup.inlineKeyboard([this.botCommon.goBackButton()])
        );

        msgs.push(introduceMsg);
        this.botCommon.tryToSaveSceneMessage(ctx, msgs);
    }*/

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: ViewRequestContext) {
        await this.botCommon.tryToDeleteMessages(ctx);
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
                await this.botCommon.executeCurrentStep(ctx);
                break;
            case ViewRequestCallbacks.BACK_TO_MAIN_MENU:
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
        if (!callbackValue && !Object.values(RequestTypes).includes(callbackValue as RequestTypes)) {
            throw new Error("Unexpected collateral type value");
        }
        ctx.scene.session.state.collateralType = callbackValue as SUPPORTED_TOKENS;
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async requestTypeActionHandler(ctx: ViewRequestContext, callbackValue?: string) {
        if (!callbackValue && !Object.values(RequestTypes).includes(callbackValue as RequestTypes)) {
            throw new Error("Unexpected request type value");
        }
        ctx.scene.session.state.requestType = callbackValue as RequestTypes;
        await this.botCommon.executeCurrentStep(ctx);
    }

    private async getXLineRequestData(
        requestType: RequestTypes,
        clId: number,
        collateralType: SUPPORTED_TOKENS,
        collateralCurrency: CollateralCurrency
    ): Promise<XLineRequestMsgData | null> {
        let data: XLineRequestMsgData | null = null;
        switch (requestType) {
            case RequestTypes.DEPOSIT:
                const dr = await this.botManagerService.getNewestDepositReq(clId);
                if (dr) {
                    data = {
                        status: dr.depositRequestStatus as string,
                        currency: collateralType as string,
                        created: dr.createdAt.toDateString(),
                        updated: dr.updatedAt.toDateString(),
                    };
                }
                break;
            case RequestTypes.WITHDRAW:
                const wr = await this.botManagerService.getNewestWithdrawReq(clId);
                if (wr) {
                    data = {
                        status: wr.withdrawRequestStatus as string,
                        currency: collateralType as string,
                        amountOrStrategy: formatUnitsNumber(
                            wr.withdrawAmount,
                            collateralCurrency.decimals
                        ),
                        requisitesOrWallet: wr.walletToWithdraw,
                        created: wr.createdAt.toDateString(),
                        updated: wr.updatedAt.toDateString(),
                    };
                }
                break;
            case RequestTypes.BORROW:
                const br = await this.botManagerService.getNewestBorrowReq(clId);
                if (br) {
                    data = {
                        status: br.borrowRequestStatus as string,
                        currency: collateralType as string,

                        requisitesOrWallet: {
                            iban: "IBAN", //FIXME
                            accountName: "Account name", //FIXME
                        },
                        created: br.createdAt.toDateString(),
                        updated: br.updatedAt.toDateString(),
                    };

                    // To add Initial risk strategy was an EXCELLENT idea!
                    if (br?.initialRiskStrategy) {
                        data.amountOrStrategy = br.initialRiskStrategy.toString(); //FIXME
                    } else if (br?.borrowFiatAmount) {
                        data.amountOrStrategy = formatUnitsNumber(br.borrowFiatAmount);
                    }
                }
                break;
            case RequestTypes.REPAY:
                const rr = await this.botManagerService.getNewestRepayReq(clId);
                if (rr) {
                    data = {
                        status: rr.repayRequestStatus as string,
                        currency: collateralType as string,
                        requisitesOrWallet: {
                            iban: "IBAN", //FIXME
                            accountName: "Account name", //FIXME
                        },
                        created: rr.createdAt.toDateString(),
                        updated: rr.updatedAt.toDateString(),
                    };
                }
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _: never = requestType;
                throw new Error(`Unknown request type: ${requestType}`);
        }
        return data;
    }
}
