import {
    ExtendedSessionData,
    DefaultSessionState,
    ExtendedWizardContext,
} from "src/modules/bot/bot.types";

export enum RepaySteps {
    VERIFY_PENDING_REQUESTS,
    SIGN_APPLICATION,
}

export enum RepayCallbacks {
    SIGN_APPLICATION = "choseCreditLine",
    BACK_TO_MAIN_MENU = "back",
}

type RepaySessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        referenceNumber?: string;
    };
};

export type RepayContext = ExtendedWizardContext<RepaySessionData>;
