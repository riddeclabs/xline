import { escapeSpecialCharacters } from "src/common";
import { BasicSourceText } from "../../common/basic-source.text";
import { CreditLineStateMsgData, Requisites, XLineRequestMsgData } from "../../common/types";

export class BorrowTextSource extends BasicSourceText {
    static getBorrowTermsText(
        maxCollateral: string,
        processingFee: string,
        debtCurrencySymbol: string
    ): string {
        return escapeSpecialCharacters(
            "📜 *BORROW TERMS*\n\n" +
                "📝 The Borrow allows you to increase your debt position.\n" +
                `After confirmation of your request by the system, the requested amount of *${debtCurrencySymbol}* will be sent to your IBAN\n\n` +
                "⚠️ Borrow operation increases the utilization rate of your position and *increases the risk of liquidation*.\n\n" +
                `️️⚠ The total debt for your position cannot exceed *${maxCollateral} %* of the remaining deposit.\n\n` +
                `⚠️ *${processingFee} %* of the borrowed amount will be applied as a processing fee.\n` +
                "An amount equal to the fee will be added to your debt position.\n"
        );
    }

    static async getAmountInputText(state: CreditLineStateMsgData): Promise<string> {
        const creditLineStateText = this.getCreditLineStateText(state, true);

        return escapeSpecialCharacters(
            `*Please enter ${state.debtCurrency} amount you want to borrow*\n\n` +
                "📊 *Current credit line state:*\n" +
                creditLineStateText +
                "\n" +
                `💡 Input example: *100.25* ( Max accuracy for ${state.debtCurrency} value is 1 cent ) `
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
            stateBefore.debtCurrency
        );
        return escapeSpecialCharacters(
            "📜 *Borrow request details*\n\n" +
                `💱 You have requested * ${borrowAmount} ${stateBefore.debtCurrency} * to borrow.\n\n` +
                "📉 *Current state:*\n" +
                creditLineStateTextBefore +
                "\n" +
                "📈 *New state:*\n" +
                creditLineStateTextAfter +
                "\n" +
                requisitesText +
                "\n" +
                processingFeeText +
                "\n" +
                `✅ After you agree to our offer, we will send the requested ${stateBefore.debtCurrency} amount to your bank account`
        );
    }

    static getBorrowSuccessText(requisites: Requisites, currency: string): string {
        const requisitesText = this.getRequisitesText(requisites);
        return escapeSpecialCharacters(
            "✅ * Done! You've created a new *Borrow* request!*\n\n" +
                `💸 We will send the requested ${currency} amount to your bank account\n\n` +
                requisitesText +
                "\n" +
                "💡 You always can check all you request details.\n" +
                `To do this go to "View my requests" tab from main menu.\n\n` +
                "⚠️ The processing time for transfer may vary.\n" +
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
        const maxAllowedUint = maxAllowed > 0 ? maxAllowed : 0;
        return escapeSpecialCharacters(
            "❌ *Entered amount is incorrect.* ❌\n\n" +
                "‼ Amount could not be greater that max allowed amount for your credit line.\n\n" +
                `*Max allowed amount:* ${maxAllowedUint}\n\n` +
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
                "‼ This can happen if your collateral value has decreased since you start created the request.\n\n" +
                "💡 It is possible that your collateral value has decreased due to market volatility.\n\n" +
                "Please try again with a smaller amount or contact our customer support team.\n"
        );
    }

    static getZeroAllowedText(): string {
        const zeroAllowedCaseText =
            "🚫 Your current max allowed borrow balance is *zero*. \n" +
            "This balance is calculated based on your current collateral balance, the collateral factor and processing fee applied to your credit line.\n";
        const txt = this.makeInsufficientBalanceTemplateText(zeroAllowedCaseText);
        return escapeSpecialCharacters(txt);
    }

    static getZeroBalanceText(): string {
        const zeroSupplyCaseText = "🚫 Your current deposit balance is *zero*. \n";
        const txt = this.makeInsufficientBalanceTemplateText(zeroSupplyCaseText);
        return escapeSpecialCharacters(txt);
    }

    private static makeInsufficientBalanceTemplateText(caseText: string) {
        return (
            "‼ You don't have sufficient funds to borrow at the moment.\n\n" +
            `${caseText}\n` +
            "💰 To add funds to your account, please create a *Deposit* request.\n\n" +
            "You can do this by navigating to the *Management of Your Credit Line* section and selecting the *Deposit* menu option."
        );
    }
}
