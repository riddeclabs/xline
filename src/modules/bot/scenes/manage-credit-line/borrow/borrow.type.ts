import {
    DefaultSessionState,
    ExtendedSessionData,
    ExtendedWizardContext,
} from "src/modules/bot/bot.types";

export enum BorrowActionSteps {
    VERIFY_PENDING_REQUESTS,
    BORROW_TERMS,
    AMOUNT_REQUEST,
    SIGN_TERMS,
}

export enum BorrowReqCallbacks {
    APPROVE_TERMS = "approveTerms",
    SIGN_APPLICATION = "signApplication",
    RE_ENTER__AMOUNT = "reEnterAmount",
    BACK_TO_MAIN_MENU = "back",
}

export type BorrowActionSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        chat_id?: string;
        creditLineId?: string;
        maxAllowedAmount?: string;
        borrowAmount?: string;
    };
};

export type BorrowContext = ExtendedWizardContext<BorrowActionSessionData>;

export type CreditLineSnapshot = {
    depositCrypto: number;
    depositFiat: number;
    cryptoCurrency: string;
    fiatCurrency: string;
    debtAmount: number;
    utilizationRate: number;
    maxUtilizationRate: number;
    maxAllowedAmount: number;
};
