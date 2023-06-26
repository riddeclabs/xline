import { escapeSpecialCharacters } from "src/common";
import { SceneRequestTypes } from "./view-request.types";
import { BasicSourceText } from "../common/basic-source.text";
import {
    CryptoTxMsgData,
    FiatTxMsgData,
    XLineRequestMsgData,
    isCryptoTxMsgData,
    isFiatTxMsgData,
} from "../common/types";

function isFiatTxMsgDataArray(txs: FiatTxMsgData[] | CryptoTxMsgData[]): txs is FiatTxMsgData[] {
    return txs[0] ? isFiatTxMsgData(txs[0]) : false;
}

function isCryptoTxMsgDataArray(txs: FiatTxMsgData[] | CryptoTxMsgData[]): txs is CryptoTxMsgData[] {
    return txs[0] ? !isCryptoTxMsgData(txs[0]) : false;
}

export class ViewRequestText extends BasicSourceText {
    static getRequestMsgText(
        data: XLineRequestMsgData,
        requestType: SceneRequestTypes,
        txList: FiatTxMsgData[] | CryptoTxMsgData[]
    ): string {
        let requestMsgText = "";

        switch (requestType) {
            case SceneRequestTypes.REPAY:
                requestMsgText = this.getRepayRequestMsgText(data);
                break;
            case SceneRequestTypes.WITHDRAW:
                requestMsgText = this.getWithdrawRequestMsgText(data);
                break;
            case SceneRequestTypes.BORROW:
                requestMsgText = this.getBorrowRequestMsgText(data);
                break;
            case SceneRequestTypes.DEPOSIT:
                requestMsgText = this.getDepositRequestMsgText(data);
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _: never = requestType;
                throw new Error("Unrecognized request type");
        }

        if (txList.length > 0) {
            requestMsgText += "\n----\n\n";
            if (
                (requestType === SceneRequestTypes.REPAY || requestType === SceneRequestTypes.BORROW) &&
                isFiatTxMsgDataArray(txList)
            ) {
                const txText = txList
                    .map(tx => BasicSourceText.getFiatTxMsgText(tx, txList.indexOf(tx) + 1))
                    .join("\n\n");
                requestMsgText += txText;
            } else if (
                (requestType === SceneRequestTypes.DEPOSIT ||
                    requestType === SceneRequestTypes.WITHDRAW) &&
                isCryptoTxMsgDataArray(txList)
            ) {
                requestMsgText += txList
                    .map(tx => this.getCryptoTxMsgText(tx, txList.indexOf(tx) + 1))
                    .join("\n\n");
            }
        }

        return escapeSpecialCharacters(requestMsgText);
    }
}
