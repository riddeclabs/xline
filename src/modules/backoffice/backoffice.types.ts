export type CollatetalCurrencyType = {
    id: number;
    symbol: string;
    decimals: number;
    amount: string;
};

export type DebtCurrencyType = { id: number; symbol: string; decimals: number; amount: string };

export type CreditLineDetailsType = {
    serialNumber: number;
    amountsTable: {
        rawSupplyAmount: string;
        usdSupplyAmount: string;
        usdCollateralAmount: string;
        debtAmount: string;
        usdAvailableLiquidity: number;
    };
    currentState: {
        utilizationFactor: string;
        healthyFactor: string;
    };
    appliedRates: {
        collateralFactor: string;
        liquidationFactor: string;
    };
    dates: {
        createdAt: string;
        updatedAt: string;
    };
    associatedRequisites: {
        iban: string;
        refNumber: string;
    };
};
