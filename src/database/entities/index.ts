import { Account } from "./account.entity";
import { Operator } from "./operator.entity";
import { Session } from "./session.entity";
import { CreditRequest } from "./creditRequest.entity";
import { RepayRequest } from "./repayRequest.entity";
import { WithdrawRequest } from "./withdrawRequest.entity";
import { CreditLineState } from "./creditLineState.entity";
import { ProcessingSettings } from "./processingSettings.entity";
import { EconomicModel } from "./economicModel.entity";

const entities = [
    Operator,
    Account,
    Session,
    CreditRequest,
    RepayRequest,
    WithdrawRequest,
    CreditLineState,
    ProcessingSettings,
    EconomicModel,
];

export {
    Account,
    Operator,
    Session,
    CreditRequest,
    RepayRequest,
    WithdrawRequest,
    CreditLineState,
    ProcessingSettings,
    EconomicModel,
};
export default entities;
