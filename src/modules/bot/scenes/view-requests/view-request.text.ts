import { escapeSpecialCharacters } from "src/common";
import { RequestTypes, XLineRequestMsgData } from "./view-request.types";

export class ViewRequestText {
    static getRequestMsgText(data: XLineRequestMsgData, requestType: RequestTypes): string {
        switch (requestType) {
            case RequestTypes.REPAY:
                return this.getRepayRequestMsgText(data);
            case RequestTypes.WITHDRAW:
                return this.getWithdrawRequestMsgText(data);
            case RequestTypes.BORROW:
                return this.getBorrowRequestMsgText(data);
            case RequestTypes.DEPOSIT:
                return this.getDepositRequestMsgText(data);
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _: never = requestType;
                throw new Error("Unrecognized request type");
        }
    }

    static getDepositRequestMsgText(data: XLineRequestMsgData): string {
        const msgHeader = "*Deposit request*\n\n";

        if (data.amountOrStrategy || data.requisitesOrWallet) {
            throw new Error("Invalid deposit request");
        }

        return escapeSpecialCharacters(
            msgHeader +
                `Status: ${data.status}\n\n` +
                `Created: ${data.created}\n` +
                `Updated: ${data.updated}\n\n`
        );
    }

    static getWithdrawRequestMsgText(data: XLineRequestMsgData): string {
        const msgHeader = "*Withdraw request*\n\n";

        if (typeof data.amountOrStrategy !== "number" || typeof data.requisitesOrWallet !== "string") {
            throw new Error("Invalid withdraw request");
        }

        return escapeSpecialCharacters(
            msgHeader +
                `Status: ${data.status}\n` +
                `Withdraw amount: ${data.amountOrStrategy} ${data.currency}\n\n` +
                "*Requisites*\n" +
                `Wallet: ${data.requisitesOrWallet}\n\n` +
                `Created: ${data.created}\n` +
                `Updated: ${data.updated}\n\n`
        );
    }

    static getBorrowRequestMsgText(data: XLineRequestMsgData): string {
        if (!data.amountOrStrategy || typeof data.requisitesOrWallet !== "object") {
            throw new Error("Invalid borrow request");
        }

        let borrowAmountText;
        if (typeof data.amountOrStrategy === "string") {
            borrowAmountText = `Strategy: ${data.amountOrStrategy}\n\n`;
        } else {
            borrowAmountText = `Borrow amount: ${data.amountOrStrategy} ${data.currency}\n\n`;
        }

        return escapeSpecialCharacters(
            "*Borrow request*\n\n" +
                `Status: ${data.status}\n` +
                borrowAmountText +
                "*Bank requisites*\n" +
                `IBAN: ${data.requisitesOrWallet.iban}\n` +
                `Account Name: ${data.requisitesOrWallet.accountName}\n\n` +
                `Created: ${data.created}\n` +
                `Updated: ${data.updated}\n\n`
        );
    }

    static getRepayRequestMsgText(data: XLineRequestMsgData): string {
        if (data.amountOrStrategy || typeof data.requisitesOrWallet !== "object") {
            throw new Error("Invalid repay request");
        }

        return escapeSpecialCharacters(
            "*Repay request*\n\n" +
                `Status: ${data.status}\n` +
                "*Bank requisites*\n" +
                `IBAN: ${data.requisitesOrWallet.iban}\n` +
                `Account Name: ${data.requisitesOrWallet.accountName}\n\n` +
                `Created: ${data.created}\n` +
                `Updated: ${data.updated}\n\n`
        );
    }
}
