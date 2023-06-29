export const GET_WALLET_PATH = "/wallet/address";
export const WITHDRAWAL_PATH = "/withdrawal";

export enum CallbackTypes {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
}

export enum CallbackTransactionStatus {
    PROCESSING = "processing",
    CREATED = "created",
    CONFIRMED = "confirmed",
    FAILED = "failed",
}
