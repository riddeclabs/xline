import { CollateralCurrency, DebtCurrency } from "../../../../database/entities";
import { DefaultSessionState, ExtendedSessionData, ExtendedWizardContext } from "../../bot.types";

export enum NewCreditRequestSteps {
    SIGN_GENERAL_TERMS,
    CHOOSE_COLLATERAL_TOKEN,
    ENTER_IBAN,
    ENTER_ACCOUNT_NAME,
    ENTER_CRYPTO_AMOUNT,
    CHOSE_RISK_STRATEGY,
    SIGN_APPLICATION,
}

export enum NewCreditReqCallbacks {
    GENERAL_TERMS = "generalTerms",
    SUPPLY_CURRENCY = "supplyCurrency",
    RISK_STRATEGY = "riskStrategy",
    SIGN_APPLICATION = "signApplication",
    VIEW_EXISTING_CREDIT_LINES = "viewExistingCreditLines",
    RE_ENTER_IBAN = "reEnterIban",
    RE_ENTER_NAME = "reEnterName",
    RE_ENTER_CRYPTO_AMOUNT = "reEnterCryptoAmount",
    BACK_TO_MAIN_MENU = "back",
}

export enum RiskStrategyLevels {
    LOW = 0.5,
    MEDIUM = 0.6,
    HIGH,
}

export const GET_DETAILS_CALLBACK = "GET_DETAILS";

type NewCreditRequestSessionData = ExtendedSessionData & {
    state: DefaultSessionState & {
        collateralCurrency?: CollateralCurrency;
        debtCurrency?: DebtCurrency;
        economicalParamsId?: number;
        riskStrategyLevel?: string;
        reqDepositAmountRaw?: string;
        iban?: string;
        bankAccountName?: string;
        cryptoCurrencyAmount?: number;
    };
};
export type NewCreditRequestContext = ExtendedWizardContext<NewCreditRequestSessionData>;

export interface SignApplicationSceneData {
    colToken: CollateralCurrency;
    debtToken: DebtCurrency;
    supplyAmount: string;
    riskStrategy: string;
    userName: string;
    userIban: string;
}
