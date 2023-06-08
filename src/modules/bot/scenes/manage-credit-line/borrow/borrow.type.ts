import { ExtendedSessionData, ExtendedWizardContext } from "src/modules/bot/bot.types";

export enum BorrowActionSteps {
    BORROW_TERMS,
    AMOUNT_REQUEST,
    SIGN_TERMS,
}

export enum BorrowReqCallbacks {
    APPROVE_TERMS = "approveTerms",
    SIGN_APPLICATION = "signApplication",
    BACK_TO_MAIN_MENU = "back",
}

export type BorrowActionSessionData = ExtendedSessionData /* & {
    state: DefaultSessionState & {
        chat_id?: string;
        userWallet?: string;
    };
}*/;

export type BorrowContext = ExtendedWizardContext<BorrowActionSessionData>;
