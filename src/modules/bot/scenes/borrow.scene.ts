import { Injectable, UseFilters } from "@nestjs/common";
import { Ctx, Wizard, WizardStep } from "nestjs-telegraf";
import { BotCommonService } from "../bot-common.service";
import { CustomExceptionFilter } from "../exception-filter";
import { ExtendedSessionData, ExtendedWizardContext } from "../bot.types";
import { escapeSpecialCharacters } from "src/common";
import { Markup } from "telegraf";

enum BorrowActionSteps {
    BORROW_TERMS,
    AMOUNT_REQUEST,
    SIGN_TERMS,
}

enum BorrowReqCallbacks {
    APPROVE_TERMS = "approveTerms",
    SIGN_APPLICATION = "signApplication",
    BACK_TO_MAIN_MENU = "back",
}

type BorrowActionSessionData = ExtendedSessionData /* & {
    state: DefaultSessionState & {
        chat_id?: string;
        userWallet?: string;
    };
}*/;

type BorrowContext = ExtendedWizardContext<BorrowActionSessionData>;

@Injectable()
@UseFilters(CustomExceptionFilter)
@Wizard(BorrowActionWizard.ID)
export class BorrowActionWizard {
    public static readonly ID = "BORROW_ACTION_WIZARD";

    constructor(private readonly botCommon: BotCommonService) {}

    @WizardStep(BorrowActionSteps.BORROW_TERMS)
    async onBorrowTerms(@Ctx() ctx: BorrowContext) {
        const maxCollateral = 80; //FIXME: get real data from the database
        const processingFee = 1; //FIXME: get real data from the database

        const msg = escapeSpecialCharacters(
            "*Borrow info*\n\n" +
                "📝 The Borrow allows you to increase your debt position.\n\n" +
                "After confirmation of your request by the system, the requested amount of USD will be sent to your IBAN\n\n" +
                "⚠️ Be careful! \n" +
                "Borrow operation increases the utilization rate of your position and increases the risk of liquidation.\n\n" +
                `The total debt for your position cannot exceed ${maxCollateral}% of the remaining deposit.` +
                `⚠️ ${processingFee}% of borrowable amount will be apply as processing fee.` +
                "An amount equal to the fee will be added to your debt position."
        );

        Markup.inlineKeyboard(
            [
                {
                    text: "✅  Ok, let's proceed",
                    callback_data: `${BorrowReqCallbacks.APPROVE_TERMS}`,
                },
                this.botCommon.goBackButton(),
            ],
            {
                columns: 1,
            }
        );
        this.botCommon.tryToSaveSceneMessage(ctx, msg);
        ctx.wizard.next();
    }

    @WizardStep(BorrowActionSteps.AMOUNT_REQUEST)
    async onAmountRequest(@Ctx() ctx: BorrowContext) {
        const depositCrypto = 78.786; //FIXME: get real data from the database
        const depositFiat = 156000; //FIXME: get real data from the database
        const cryptoCurrency = "ETH"; //FIXME: get real data from the database
        const fiatCurrency = "USD"; //FIXME: get real data from the database
        const debtAmount = 96720; //FIXME: get real data from the database
        const utilizationRate = 62; //FIXME: get real data from the database
        const maxUtilizationRate = 80; //FIXME: get real data from the database
        const maxAllowedAmount = 28080; //FIXME: get real data from the database

        const msg = escapeSpecialCharacters(
            `*Please enter ${fiatCurrency} amount you want to borrow*\n\n` +
                "Current state:\n" +
                `Deposit amount: ${depositCrypto} ${cryptoCurrency} / ${depositFiat} ${fiatCurrency}\n` +
                `Debt amount: ${debtAmount} ${fiatCurrency}\n` +
                `Utilization rate: ${utilizationRate}%\n` +
                `Max utilization rate: ${maxUtilizationRate}%\n\n` +
                `Max allowed amount to borrow: ${maxAllowedAmount} ${fiatCurrency}\n\n` +
                `Max accuracy for USD value ia 1 cent.`
        );
    }
}
