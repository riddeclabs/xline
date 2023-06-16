import { CreditLine } from "../../database/entities";

export type CreditLineCurrencyExtended = CreditLine;

export type CreditLineDetails = CreditLineCurrencyExtended & {
    utilizationRate: bigint;
    fiatCollateralAmount: bigint;
};
