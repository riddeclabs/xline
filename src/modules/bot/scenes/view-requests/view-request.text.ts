import { escapeSpecialCharacters } from "src/common";
import { SceneRequestTypes } from "./view-request.types";
import { BasicSourceText } from "../common/basic-source.text";
import { XLineRequestMsgData } from "../common/types";

export class ViewRequestText extends BasicSourceText {
    static getRequestMsgText(data: XLineRequestMsgData, requestType: SceneRequestTypes): string {
        switch (requestType) {
            case SceneRequestTypes.REPAY:
                return escapeSpecialCharacters(this.getRepayRequestMsgText(data));
            case SceneRequestTypes.WITHDRAW:
                return escapeSpecialCharacters(this.getWithdrawRequestMsgText(data));
            case SceneRequestTypes.BORROW:
                return escapeSpecialCharacters(this.getBorrowRequestMsgText(data));
            case SceneRequestTypes.DEPOSIT:
                return escapeSpecialCharacters(this.getDepositRequestMsgText(data));
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _: never = requestType;
                throw new Error("Unrecognized request type");
        }
    }
}
