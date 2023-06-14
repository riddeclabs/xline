export interface Requisites {
    iban: string;
    accountName: string;
}

export interface XLineRequestMsgData {
    status: string;
    amountOrStrategy?: number | string;
    currency: string;
    created: string;
    updated: string;
    requisitesOrWallet?: string | Requisites;
}

export interface CreditLineStateMsgData {
    supplyCrypto: number;
    supplyFiat: number;
    cryptoCurrency: string;
    fiatCurrency: string;
    debtAmount: number;
    utilizationRatePercent: string;
    maxAllowedAmount: number;
    liquidationRisk: string;
    hasBeenLiquidated: "yes" | "no";
}
