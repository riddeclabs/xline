export class ResolveCryptoBasedRequestDto {
    requestId!: number;
    from!: string;
    to!: string;
    rawTransferAmount!: string;
    usdTransferAmount!: string;
    txHash!: string;
}

export class ResolveFiatBasedRequestDto {
    requestId!: number;
    ibanFrom!: string;
    ibanTo!: string;
    nameFrom!: string;
    nameTo!: string;
    rawTransferAmount!: string;
    status!: string;
}
