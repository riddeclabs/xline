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

export interface XGWValidationErrorResponse {
    errors: { message: string }[];
    success: boolean;
}
