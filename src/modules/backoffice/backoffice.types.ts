export type CollatetalCurrencyType = {
    id: number;
    symbol: string;
    decimals: number;
    amount: string;
};

export type DebtCurrencyType = { id: number; symbol: string; decimals: number; amount: string };

export type AllRequestByCreditLineType = {
    id: number;
    type: string;
    status: string;
    created_at: string;
    updated_at: string;
};

export type CreditLineDetailsType = {
    serialNumber: number;
    debtSymbol: string;
    collateralSymbol: string;
    creditLineId: number;
    amountsTable: {
        rawDepositAmount: string;
        usdDepositAmount: string;
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
