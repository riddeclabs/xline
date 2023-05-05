import { Injectable, UseFilters } from "@nestjs/common";
import { Action, Ctx, Hears, Wizard, WizardStep } from "nestjs-telegraf";
import { Markup } from "telegraf";
import { callbackQuery } from "telegraf/filters";
import { MainScene } from "./main.scene";
import { BotCommonService } from "../bot-common.service";
import { DefaultSessionState, ExtendedSessionData, ExtendedWizardContext } from "../bot.types";
import { SUPPORTED_TOKENS } from "../constants";
import { Message } from "typegram";
import { CustomExceptionFilter } from "../exception-filter";

enum ViewRequestSteps {
    CHOSE_REQUEST_TYPE,
    CHOSE_COLLATERAL_TYPE,
    VIEW_REQUEST,
    VIEW_ALL_REQUESTS,
}
enum ViewRequestCallbacks {
    REQUEST_TYPE = "chooseReqType",
    COLLATERAL_TYPE = "choseCollateralType",
    VIEW_ALL = "viewAll",
    BACK_TO_MAIN_MENU = "back",
}
enum RequestTypes {
    REPAY = "repay",
    WITHDRAW = "withdraw",
    NEW_CREDIT = "newCredit",
}

type ViewRequestSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        requestType?: RequestTypes;
        collateralType?: SUPPORTED_TOKENS;
    };
};
type ViewRequestContext = ExtendedWizardContext<ViewRequestSessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(ViewRequestWizard.ID)
export class ViewRequestWizard {
    public static readonly ID = "VIEW_REQUEST_WIZARD";

    constructor(private readonly botCommon: BotCommonService) {}

    @WizardStep(ViewRequestSteps.CHOSE_REQUEST_TYPE)
    async onChoseRequestType(@Ctx() ctx: ViewRequestContext) {
        const msg = await ctx.reply(
            "📋 Choose the request type you want to see" + "\n" + "\n",
            Markup.inlineKeyboard(
                [
                    {
                        text: "Repay",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${RequestTypes.REPAY}`,
                    },
                    {
                        text: "Withdraw",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${RequestTypes.WITHDRAW}`,
                    },
                    {
                        text: "New credit",
                        callback_data: `${ViewRequestCallbacks.REQUEST_TYPE}:${RequestTypes.NEW_CREDIT}`,
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
            `💰 Chose the collateral type` + "\n" + "\n",
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

        // TODO: get actual data from the database
        const userRequest = this.getAllUserRequests(chat_id, requestType, collateralType).pop();

        let mainMsg: Message;
        if (!userRequest) {
            mainMsg = await ctx.reply(
                `🤷 You don't have ${requestType} requests.\n` +
                    `\n` +
                    `🆕 You can create a new one from the main menu interface`,
                Markup.inlineKeyboard([this.botCommon.goBackButton()])
            );
            this.botCommon.tryToSaveSceneMessage(ctx, mainMsg);
            return;
        }

        const msgByReqType = this.getMsgByRequestType(userRequest, collateralType, requestType);

        const introduceMsg = await ctx.reply(
            `📒 Here you go.\n` + `This is your last ${requestType} request data`
        );

        mainMsg = await ctx.reply(
            msgByReqType,
            Markup.inlineKeyboard(
                [
                    {
                        text: `View all ${requestType} request`,
                        callback_data: `${ViewRequestCallbacks.VIEW_ALL}:${requestType}`,
                    },
                    this.botCommon.goBackButton(),
                ],
                { columns: 1 }
            )
        );

        this.botCommon.tryToSaveSceneMessage(ctx, [introduceMsg, mainMsg]);
        ctx.wizard.next();
    }

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
    }

    @Action(/.*/)
    async onActionHandler(@Ctx() ctx: ViewRequestContext) {
        await this.botCommon.tryToDeleteMessages(ctx);

        // Enter scene handler.
        if (ctx.scene.session.cursor == ViewRequestSteps.CHOSE_REQUEST_TYPE) {
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

    private getMsgByRequestType(
        reqData: RepayRequest | WithdrawRequest | NewCreditRequest,
        collateralType?: SUPPORTED_TOKENS,
        requestType?: RequestTypes
    ) {
        let msgByReqType: string;
        if (requestType === RequestTypes.REPAY) {
            const req = reqData as RepayRequest;

            msgByReqType =
                "📰 Repay request \n" +
                `\n` +
                `Status: ${req.status} \n` +
                `Repay amount: ${req.repayAmountFiat} EUR \n` +
                `IBAN to repay: ${req.iban} \n` +
                `Withdraw amount: ${req.withdrawAmount} ${collateralType}\n` +
                `Wallet withdraw to: ${req.walletWithdrawTo} \n` +
                `CreatedAt: ${req.createdAt}\n` +
                `FinishedAt: ${req.finishedAt}`;
        } else if (requestType == RequestTypes.WITHDRAW) {
            const req = reqData as WithdrawRequest;
            msgByReqType =
                "📰 Withdraw request \n" +
                `\n` +
                `Status: ${req.status} \n` +
                `Withdraw amount: ${req.withdrawAmount} ${collateralType} \n` +
                `Wallet withdraw to: ${req.walletWithdrawTo} \n` +
                `Tx hash: ${req.txHash} ${collateralType}\n` +
                `CreatedAt: ${req.createdAt} \n` +
                `FinishedAt: ${req.finishedAt}`;
        } else if (requestType == RequestTypes.NEW_CREDIT) {
            const req = reqData as NewCreditRequest;
            msgByReqType =
                "📰 New credit request \n" +
                `\n` +
                `Live status: ${req.liveStatus} \n` +
                `Approve status ${req.approveStatus} \n` +
                `Repay amount: ${req.repayAmountFiat} EUR \n` +
                `User IBAN: ${req.iban} \n` +
                `Collateral amount: ${req.collateralAmount} ${collateralType}\n` +
                `Credit amount: ${req.creditAmountFiat} \n` +
                `Is fiat sent: ${req.isFiatSent} \n` +
                `Wallet to deposit: ${req.wallet} \n` +
                `CreatedAt: ${req.createdAt} \n` +
                `FinishedAt: ${req.finishedAt} \n`;
        } else {
            throw new Error("Unexpected request type received");
        }

        return msgByReqType;
    }

    private getAllUserRequests(chatId: number | undefined, reqType?: string, collateralType?: string) {
        const repayRequests: RepayRequest[] = [
            {
                status: "Finished",
                repayAmountFiat: 125.7,
                iban: "EU BV 1518 2473 5786",
                withdrawAmount: 12.4,
                walletWithdrawTo: "0xVasin_wallet_hash",
                createdAt: new Date(),
                finishedAt: new Date(),
            },
            {
                status: "Finished",
                repayAmountFiat: 1475,
                iban: "EU BV 9524 2144 1684",
                withdrawAmount: 184,
                walletWithdrawTo: "0xAlbert_wallet_hash",
                createdAt: new Date(),
                finishedAt: new Date(),
            },
            {
                status: "Fiat repay wait",
                repayAmountFiat: 1475,
                iban: "EU BV 9524 2144 1684",
                withdrawAmount: 184,
                walletWithdrawTo: "0xAlbert_wallet_hash",
                createdAt: new Date(),
                finishedAt: new Date(),
            },
        ];

        const withdrawRequests: WithdrawRequest[] = [
            {
                status: "Finished",
                withdrawAmount: 147.54,
                walletWithdrawTo: "0xVasya_wallet_hash",
                txHash: "0x99a1b337a43ee45c52a649f8ca52241da3cac8f5cc6996b06e449d45c5e44ff3",
                createdAt: new Date(),
                finishedAt: new Date(),
            },
        ];

        const newCreditRequests: NewCreditRequest[] = [
            {
                liveStatus: "Approve wait",
                approveStatus: "Not verified",
                repayAmountFiat: 1475,
                iban: "EU BV 9524 2144 1684",
                collateralAmount: 24.87,
                creditAmountFiat: 27845.25,
                isFiatSent: false,
                wallet: "0xVasya_wallet_hash",
                createdAt: new Date(),
                finishedAt: null,
            },
        ];

        switch (reqType) {
            case "repay":
                return repayRequests;
            case "withdraw":
                return withdrawRequests;
            case "newCredit":
                return newCreditRequests;
            default:
                throw new Error("Unexpected request type received");
        }
    }
}

// Temporary mock types
export interface RepayRequest {
    status: string;
    repayAmountFiat: number;
    iban: string;
    withdrawAmount: number;
    walletWithdrawTo: string;
    createdAt: Date;
    finishedAt: Date;
}
export interface WithdrawRequest {
    status: string;
    withdrawAmount: number;
    walletWithdrawTo: string;
    txHash: string;
    createdAt: Date;
    finishedAt: Date;
}
export interface NewCreditRequest {
    liveStatus: string;
    approveStatus: string;
    repayAmountFiat: number;
    iban: string;
    collateralAmount: number;
    creditAmountFiat: number;
    isFiatSent: boolean;
    wallet: string;
    createdAt: Date;
    finishedAt: Date | null;
}
