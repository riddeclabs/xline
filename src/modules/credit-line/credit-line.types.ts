import { CollateralCurrency, CreditLine, DebtCurrency } from "../../database/entities";

export type CreditLineCurrencyExtended = CreditLine & {
    collateralToken: CollateralCurrency;
    debtToken: DebtCurrency;
};

export type CreditLineDetails = CreditLineCurrencyExtended & {
    utilizationRate: bigint;
    fiatCollateralAmount: bigint;
};
