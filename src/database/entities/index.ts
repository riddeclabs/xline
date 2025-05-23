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
import { BusinessPaymentRequisite } from "./business-payment-requisite.entity";
import { CryptoTransaction } from "./transactions/crypto-transaction.entity";
import { FiatTransaction } from "./transactions/fiat-transactions.entity";
import { EconomicalParameters } from "./economical-parameters.entity";
import { PaymentProcessing } from "./payment-processing.entity";

const entities = [
    CryptoTransaction,
    FiatTransaction,
    WithdrawRequest,
    DepositRequest,
    BorrowRequest,
    RepayRequest,
    CreditLine,
    EconomicalParameters,
    UserPaymentRequisite,
    User,
    DebtCurrency,
    CollateralCurrency,
    BusinessPaymentRequisite,
    Session,
    Operator,
    PaymentProcessing,
];

export {
    CryptoTransaction,
    FiatTransaction,
    WithdrawRequest,
    DepositRequest,
    BorrowRequest,
    RepayRequest,
    CreditLine,
    EconomicalParameters,
    UserPaymentRequisite,
    User,
    DebtCurrency,
    CollateralCurrency,
    BusinessPaymentRequisite,
    Operator,
    Session,
    PaymentProcessing,
};
export default entities;
