export class CreateFiatTransactionDto {
    readonly borrowRequestId!: number | null;
    readonly repayRequestId!: number | null;
    readonly ibanFrom!: string;
    readonly ibanTo!: string;
    readonly nameFrom!: string;
    readonly nameTo!: string;
    readonly rawTransferAmount!: bigint;
}
