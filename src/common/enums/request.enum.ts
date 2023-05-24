export enum WithdrawRequestStatus {
    PENDING = "PENDING",
    FINISHED = "FINISHED",
    REJECTED = "REJECTED",
}

export enum DepositRequestStatus {
    PENDING = "PENDING",
    FINISHED = "FINISHED",
    REJECTED = "REJECTED",
}

export enum BorrowRequestStatus {
    VERIFICATION_PENDING = "VERIFICATION_PENDING",
    MONEY_SENT = "MONEY_SENT",
    FINISHED = "FINISHED",
    REJECTED = "REJECTED",
}

export enum RepayRequestStatus {
    VERIFICATION_PENDING = "VERIFICATION_PENDING",
    FINISHED = "FINISHED",
    REJECTED = "REJECTED",
}

export enum ActionTypes {
    DEPOSIT,
    WITHDRAW,
    BORROW,
    REPAY,
}
