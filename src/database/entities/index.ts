import { Operator } from "./operator.entity";
import { Session } from "./session.entity";
import { WithdrawRequest } from "./requests/withdraw-request.entity";
import { DepositRequest } from "./requests/deposit-request.entity";
import { BorrowRequest } from "./requests/borrow-request.entity";
import { RepayRequest } from "./requests/repay-request.entity";
import { CreditLine } from "./credit-line.entity";
import { User } from "./users/user.entity";
import { UserPaymentRequisite } from "./users/user-payment-requisite.entity";
import { DebtCurrency } from "./currencies.entity";
import { CollateralCurrency } from "./currencies.entity";
import { CreditLineStatus } from "../../common";

const entities = [
    Operator,
    Session,
    WithdrawRequest,
    DepositRequest,
    BorrowRequest,
    RepayRequest,
    CreditLine,
    User,
    UserPaymentRequisite,
    DebtCurrency,
    CollateralCurrency,
    CreditLineStatus,
];

export {
    Operator,
    Session,
    WithdrawRequest,
    DepositRequest,
    BorrowRequest,
    RepayRequest,
    CreditLine,
    User,
    UserPaymentRequisite,
    DebtCurrency,
    CollateralCurrency,
    CreditLineStatus,
};
export default entities;
