import { DefaultSessionState, ExtendedSessionData, ExtendedWizardContext } from "../../../bot.types";

export enum WithdrawSteps {
    VERIFY_PENDING_REQUESTS,
    SIGN_WITHDRAW_TERMS,
    ENTER_WITHDRAW_AMOUNT,
    ENTER_ADDRESS_TO_WITHDRAW,
    SIGN_WITHDRAW_APPLICATION,
}

export enum WithdrawCallbacks {
    DEPOSIT_REDIRECT = "depositRedirect",
    SIGN_WITHDRAW_TERMS = "signWithdrawTerms",
    SIGN_APPLICATION = "signApplication",
    INCORRECT_USER_INPUT = "incorrectInput",
    WITHDRAW_ALL = "withdrawAll",
    BACK_TO_MAIN_MENU = "back",
}

type WithdrawSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        addressToWithdraw?: string;
        requestedWithdrawAmountRaw?: string;
        isWithdrawAllCase?: boolean;
    };
};

export type WithdrawContext = ExtendedWizardContext<WithdrawSessionData>;
