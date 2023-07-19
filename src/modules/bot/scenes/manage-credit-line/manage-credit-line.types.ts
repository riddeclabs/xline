import { DefaultSessionState, ExtendedSessionData, ExtendedWizardContext } from "../../bot.types";

export enum ManagePortfolioSteps {
    CHOSE_CREDIT_LINE,
    VIEW_LINE_DETAILS,
}

export enum ManagePortfolioCallbacks {
    CHOSE_CREDIT_LINE = "choseCreditLine",
    VIEW_LINE_DETAILS = "viewLineDetails",
    BACK_TO_MAIN_MENU = "back",
}

export enum LineActions {
    DEPOSIT = "DEPOSIT",
    WITHDRAW = "WITHDRAW",
    BORROW = "BORROW",
    REPAY = "REPAY",
}

type ManageCreditLineSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        creditLineId?: string;
    };
};

export type ManageCreditLineContext = ExtendedWizardContext<ManageCreditLineSessionData>;
