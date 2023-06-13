export enum RequestTypes {
    REPAY = "repay",
    WITHDRAW = "withdraw",
    BORROW = "BorrowRequest",
    DEPOSIT = "deposit",
}

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
