export interface OpenCreditLineData {
    expDepositAmountUsd: bigint;
    expBorrowAmountUsd: bigint;
    expCollateralAmountUsd: bigint;
    collateralLimitPrice: bigint;
    currentPrice: bigint;
    depositProcFeeUsd: bigint;
    borrowProcFeeUsd: bigint;
    totalProcFeeUsd: bigint;
}

export interface CryptoFee {
    feeCrypto: bigint;
    feeFiat: bigint;
}
