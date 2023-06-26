import { BorrowRequest, DepositRequest, RepayRequest, WithdrawRequest } from "src/database/entities";

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

export interface FiatTxMsgData {
    ibanFrom: string;
    ibanTo: string;
    nameFrom: string;
    nameTo: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
    updated: string;
}

export interface CryptoTxMsgData {
    txHash: string;
    amount: number;
    currency: string;
    //type: string; TODO: Add type DEPOSIT/ WITHDRAW/ FEE?
    created: string;
    updated: string;
}

export type XLineCryptoBaseRequestsTypes = DepositRequest | WithdrawRequest;
export type XLineFiatBaseRequestsTypes = BorrowRequest | RepayRequest;
export type XLineRequestsTypes = XLineCryptoBaseRequestsTypes | XLineFiatBaseRequestsTypes;

export function isBorrowRequest(req: XLineRequestsTypes): req is BorrowRequest {
    return "borrowRequestStatus" in req;
}

export function isDepositRequest(req: XLineRequestsTypes): req is DepositRequest {
    return "depositRequestStatus" in req;
}

export function isRepayRequest(req: XLineRequestsTypes): req is RepayRequest {
    return "repayRequestStatus" in req;
}

export function isWithdrawRequest(req: XLineRequestsTypes): req is WithdrawRequest {
    return "withdrawRequestStatus" in req;
}

export function isFiatTxMsgData(tx: FiatTxMsgData | CryptoTxMsgData): tx is FiatTxMsgData {
    return "ibanFrom" in tx;
}

export function isCryptoTxMsgData(tx: FiatTxMsgData | CryptoTxMsgData): tx is CryptoTxMsgData {
    return "txHash" in tx;
}
