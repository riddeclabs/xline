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
    supplyAmountCrypto: number;
    supplyAmountFiat: number;
    cryptoCurrency: string;
    debtCurrency: string;
    debtAmount: number;
    utilizationRatePercent: string;
    maxAllowedBorrowAmount: number;
    liquidationRisk: string;
    hasBeenLiquidated: "Yes" | "No";
}
