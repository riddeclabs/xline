export type CollatetalCurrencyType = {
    id: number;
    symbol: string;
    decimals: number;
    amount: string;
};

export type DebtCurrencyType = { id: number; symbol: string; decimals: number; amount: string };

export type GetAllRepayRequestType = {
    repay_id: number;
    repay_credit_line_id: number;
    repay_business_payment_requisite_id: number;
    repay_repay_request_status: string;
    repay_created_at: Date;
    repay_updated_at: Date;
    creditLine_ref_number: string;
    businessPaymentRequisite_id: number;
    businessPaymentRequisite_iban: string;
    collateralCurrency_symbol: string;
    debtCurrency_symbol: number;
    userPaymentRequisite_iban: string;
    user_chat_id: number;
};

export type GetAllBorrowRequestType = {
    borrow_id: number;
    borrow_credit_line_id: number;
    borrow_borrow_request_status: string;
    borrow_borrow_fiat_amount: number;
    borrow_initial_risk_strategy: string;
    borrow_created_at: Date;
    borrow_updated_at: Date;
    collateralCurrency_symbol: string;
    debtCurrency_symbol: string;
    userPaymentRequisite_iban: string;
    user_chat_id: number;
};
