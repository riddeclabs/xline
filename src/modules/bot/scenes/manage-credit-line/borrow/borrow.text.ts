import { escapeSpecialCharacters } from "src/common";
import { BasicSourceText } from "../../common/basic-source.text";
import { CreditLineStateMsgData, Requisites, XLineRequestMsgData } from "../../common/types";

export class BorrowTextSource extends BasicSourceText {
    static getBorrowTermsText(maxCollateral: string, processingFee: string): string {
        return escapeSpecialCharacters(
            "📜 *BORROW TERMS*\n\n" +
                "📝 The Borrow allows you to increase your debt position.\n" +
                "After confirmation of your request by the system, the requested amount of *${debtSymbol}* will be sent to your IBAN\n\n" +
                "⚠️ Borrow operation increases the utilization rate of your position and *increases the risk of liquidation*.\n\n" +
                `️️⚠ The total debt for your position cannot exceed *${maxCollateral} %* of the remaining deposit.\n\n` +
                `⚠️ *${processingFee} %* of the borrowed amount will be applied as a processing fee.\n` +
                "An amount equal to the fee will be added to your debt position.\n"
        );
    }

    static async getAmountInputText(state: CreditLineStateMsgData): Promise<string> {
        const creditLineStateText = this.getCreditLineStateText(state);
        return escapeSpecialCharacters(
            `*Please enter ${state.fiatCurrency} amount you want to borrow*\n\n` +
                "📊 *Current state:*\n" +
                creditLineStateText +
                "\n" +
                `Max accuracy for USD value ia 1 cent.`
        );
    }

    static getSignTermsText(
        stateBefore: CreditLineStateMsgData,
        stateAfter: CreditLineStateMsgData,
        borrowAmount: number,
        processingFee: number,
        requisites: Requisites
    ): string {
        const creditLineStateTextBefore = this.getCreditLineStateText(stateBefore, false);
        const creditLineStateTextAfter = this.getCreditLineStateText(stateAfter, false);
        const requisitesText = this.getRequisitesText(requisites);
        const processingFeeText = BorrowTextSource.getFiatProcessingFeeText(
            borrowAmount,
            processingFee,
            stateBefore.fiatCurrency
        );
        return escapeSpecialCharacters(
            "*Borrow request details*\n\n" +
                `You have requested ${borrowAmount} ${stateBefore.fiatCurrency} to borrow.\n\n` +
                "📊 *Old state:*\n" +
                creditLineStateTextBefore +
                "\n" +
                "📊 *New state:*\n" +
                creditLineStateTextAfter +
                "\n" +
                requisitesText +
                "\n" +
                processingFeeText +
                "\n" +
                "❗️ After you agree to our offer, we will send requested USD amount to your bank account"
        );
    }

    static getBorrowSuccessText(requisites: Requisites): string {
        const requisitesText = this.getRequisitesText(requisites);
        return escapeSpecialCharacters(
            "✅ Done! You've created 'Borrow' request.\n\n" +
                "We will send requested USD amount to your bank account\n\n" +
                requisitesText +
                "\n" +
                "💡 You always can check all you request details.\n" +
                `To do this go to "View my requests" tab from main menu.\n\n` +
                "⚠️ The processing time for transfers may vary.\n\n" +
                "Factors influencing transfer speed include:\n" +
                " - Banking provider\n" +
                " - Timing of payment initiation\n" +
                " - Network congestion\n"
        );
    }

    static getBorrowDisapprovedText(): string {
        return escapeSpecialCharacters(
            "❌ *Borrow Request Rejected* ❌\n\n" +
                "We have received confirmation that you've rejected the request to borrow.\n" +
                "If you have any questions or need further assistance, please contact our customer support team.\n"
        );
    }

    static getAmountValidationErrorMsg(userInput: string): string {
        return escapeSpecialCharacters(
            "❌ *Entered amount is incorrect.* ❌\n\n" +
                "‼ Amount should be a number greater than 0.\n\n" +
                "For example: *1000* or *1000.00*.\n\n" +
                `*Entered amount:* ${userInput}\n\n` +
                "Please try again."
        );
    }

    static getAmountDecimalsValidationErrorMsg(userInput: string, decimals: number): string {
        return escapeSpecialCharacters(
            "❌ *Entered amount is incorrect.* ❌\n\n" +
                `‼ Amount should have no more than ${decimals} decimals.\n\n` +
                "For example: *1000* or *1000.91*.\n\n" +
                `*Entered amount:* ${userInput}\n\n` +
                "Please try again."
        );
    }

    static getAmountValidationErrorMaxAllowedMsg(userInput: string, maxAllowed: number): string {
        return escapeSpecialCharacters(
            "❌ *Entered amount is incorrect.* ❌\n\n" +
                "‼ Amount could not be grater that max allowed amount for your credit line.\n\n" +
                `*Max allowed amount:* ${maxAllowed}\n\n` +
                `*Entered amount:* ${userInput}\n\n` +
                "Please try again."
        );
    }

    static getExistingBorrowRequestErrorMsg(data: XLineRequestMsgData): string {
        const existingReqDetailsText = this.getBorrowRequestMsgText(data);

        return escapeSpecialCharacters(
            "❌ *Previously created borrow request is unresolved* ❌\n\n" +
                "‼ You have already created a borrow request.\n\n" +
                "‼ XLine supports only one active request per credit line at a time.\n" +
                "‼ You can create a new request after the previous one is resolved.\n" +
                "💡 Please wait for the previous request to be resolved or contact our customer support team.\n\n" +
                "📊 *Your previous request details:*\n\n" +
                existingReqDetailsText
        );
    }

    static getFinalAmountValidationFailedMsg(): string {
        return escapeSpecialCharacters(
            "❌ *Borrow amount doesn't pass solvency check* ❌\n\n" +
                "‼ Amount you request could not be covered by your collateral.\n\n" +
                "‼ This can happen if your collateral value has decreased since you start created the request.\n" +
                "💡 It is possible that your collateral value has decreased due to market volatility.\n\n" +
                "Please try again with a smaller amount or contact our customer support team.\n"
        );
    }
}
