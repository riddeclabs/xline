import { CreditLineState, CreditRequest } from "src/database/entities";

export enum Currency {
    ETH = "ETH",
    BTC = "BTC",
}

export type PlainCreditLineState = Omit<CreditLineState, "creditRequestPk" | "repayRequest">;
export type CreditRequestFinParam = Pick<
    CreditRequest,
    "userId" | "apr" | "collateralFactor" | "liquidationFactor" | "liquidationFee"
>;
export type ExtendedCreditLineState = PlainCreditLineState & CreditRequestFinParam;
