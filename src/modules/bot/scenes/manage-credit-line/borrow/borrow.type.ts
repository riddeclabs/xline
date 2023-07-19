import {
    DefaultSessionState,
    ExtendedSessionData,
    ExtendedWizardContext,
} from "src/modules/bot/bot.types";

export enum BorrowActionSteps {
    VERIFY_PENDING_REQUESTS,
    VERIFY_IS_BORROW_POSSIBLE,
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

type BorrowActionSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        borrowAmount?: string;
    };
};

export type BorrowContext = ExtendedWizardContext<BorrowActionSessionData>;
