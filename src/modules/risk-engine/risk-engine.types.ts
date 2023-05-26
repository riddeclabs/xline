export interface OpenCreditLineData {
    expSupplyAmountUsd: bigint;
    expBorrowAmountUsd: bigint;
    expCollateralAmountUsd: bigint;
    collateralLimitPrice: bigint;
    currentPrice: bigint;
    supplyProcFeeUsd: bigint;
    borrowProcFeeUsd: bigint;
    totalProcFeeUsd: bigint;
}