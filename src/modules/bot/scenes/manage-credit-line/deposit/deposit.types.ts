import { ExtendedWizardContext } from "src/modules/bot/bot.types";

export enum DepositSteps {
    VERIFY_PENDING_REQUESTS,
    SIGN_APPLICATION,
}

export enum DepositCallbacks {
    SIGN_APPLICATION = "choseCreditLine",
    BACK_TO_MAIN_MENU = "back",
}

export type DepositContext = ExtendedWizardContext;
