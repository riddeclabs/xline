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
