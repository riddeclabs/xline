export class CreateFiatTransactionDto {
    readonly borrowRequestId!: number | null;
    readonly repayRequestId!: number | null;
    readonly ibanFrom!: string;
    readonly ibanTo!: string;
    readonly nameFrom!: string;
    readonly nameTo!: string;
    readonly rawTransferAmount!: bigint;
}

export class CreateCryptoTransactionDto {
    readonly withdrawRequestId!: number | null;
    readonly depositRequestId!: number | null;
    readonly from!: string;
    readonly to!: string;
    readonly rawTransferAmount!: bigint;
    readonly usdTransferAmount!: bigint;
    readonly txHash!: string;
}
