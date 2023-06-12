import { escapeSpecialCharacters } from "src/common";
import { BasicSourceText } from "../../common/basic-source.text";
import { CreditLineSnapshot } from "./borrow.type";
import { RiskStrategyLevels } from "../../new-credit-request/new-credit-request.types";

export class BorrowTextSource extends BasicSourceText {
    static getBorrowTermsText(maxCollateral: number, processingFee: number): string {
        return escapeSpecialCharacters(
            "*Borrow info*\n\n" +
                "📝 The Borrow allows you to increase your debt position.\n\n" +
                "After confirmation of your request by the system, the requested amount of USD will be sent to your IBAN\n\n" +
                "⚠️ Be careful! \n" +
                "Borrow operation increases the utilization rate of your position and increases the risk of liquidation.\n\n" +
                `The total debt for your position cannot exceed ${maxCollateral}% of the remaining deposit.\n` +
                `⚠️ ${processingFee}% of borrowed amount will be apply as processing fee.\n` +
                "An amount equal to the fee will be added to your debt position.\n"
        );
    }

    static async getAmountInputText(cls: CreditLineSnapshot): Promise<string> {
        return escapeSpecialCharacters(
            `*Please enter ${cls.fiatCurrency} amount you want to borrow*\n\n` +
                "📊 *Current state:*\n" +
                `Deposit amount: ${cls.depositCrypto} ${cls.cryptoCurrency} / ${cls.depositFiat} ${cls.fiatCurrency}\n` +
                `Debt amount: ${cls.debtAmount} ${cls.fiatCurrency}\n` +
                `Utilization rate: ${cls.utilizationRate}%\n` +
                `Max utilization rate: ${cls.maxUtilizationRate}%\n\n` +
                `Max allowed amount to borrow: ${cls.maxAllowedAmount} ${cls.fiatCurrency}\n\n` +
                `Max accuracy for USD value ia 1 cent.`
        );
    }

    static getSignTermsText(
        before: CreditLineSnapshot,
        after: CreditLineSnapshot,
        borrowAmount: number,
        name: string,
        iban: string
    ): string {
        const liquidationRiskBefore = BorrowTextSource.getCurrentLiquidationRisk(
            before.utilizationRate,
            before.maxUtilizationRate
        );
        const liquidationRiskAfter = BorrowTextSource.getCurrentLiquidationRisk(
            after.utilizationRate,
            after.maxUtilizationRate
        );

        return escapeSpecialCharacters(
            "*Borrow request details*\n\n" +
                `You have requested ${borrowAmount} ${after.fiatCurrency} to borrow.\n\n` +
                "📊 *Old state:*\n" +
                `Deposit amount: ${before.depositCrypto} ${before.cryptoCurrency} / ${before.depositFiat} ${before.fiatCurrency}\n` +
                `Debt amount: ${before.debtAmount} ${before.fiatCurrency}\n` +
                `Utilization rate: ${before.utilizationRate}%\n` +
                `Liquidation risk: ${liquidationRiskBefore}\n\n` +
                "📊 *New state:*\n" +
                `Deposit amount: ${after.depositCrypto} ${after.cryptoCurrency} / ${after.depositFiat} ${after.fiatCurrency}\n` +
                `Debt amount: ${after.debtAmount} ${after.fiatCurrency}\n` +
                `Utilization rate: ${after.utilizationRate.toFixed(2)}%\n` +
                `Liquidation risk: ${liquidationRiskAfter}\n\n` +
                "🏦 *Bank account info*:\n" +
                `IBAN: ${iban}\n` +
                `Account name: ${name}\n\n` +
                "❗️ After you agree to our offer, we will send requested USD amount to your bank account"
        );
    }

    static getBorrowSuccessText(name: string, iban: string): string {
        return escapeSpecialCharacters(
            "✅ Done! You've created 'Borrow' request.\n\n" +
                "We will send requested USD amount to your bank account\n\n" +
                "🏦 *Bank account info*:\n" +
                `IBAN: ${iban}\n` +
                `Account name: ${name}\n\n` +
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

    static getAmountValidationErrorMaxAllowedMsg(userInput: string, maxAllowed: number): string {
        return escapeSpecialCharacters(
            "❌ *Entered amount is incorrect.* ❌\n\n" +
                "‼ Amount could not be grater that max allowed amount for your credit line.\n\n" +
                `*Max allowed amount:* ${maxAllowed}\n\n` +
                `*Entered amount:* ${userInput}\n\n` +
                "Please try again."
        );
    }

    static getExistingBorrowRequestErrorMsg(
        currency: string,
        creationDate: string,
        amount?: number,
        strategy?: number
    ): string {
        if (!amount && !strategy) {
            throw new Error("Amount or strategy should be defined");
        }

        let requestDetailsText = "📊 *Your previous request details:*\n\n";
        if (!amount && strategy) {
            if (strategy === RiskStrategyLevels.LOW) {
                requestDetailsText += `🚦 Strategy: 🟢 LOW - ${
                    RiskStrategyLevels.LOW * 100
                }% utilization\n`;
            } else if (strategy === RiskStrategyLevels.MEDIUM) {
                requestDetailsText += `🚦 Strategy: 🟡 MEDIUM - ${
                    RiskStrategyLevels.MEDIUM * 100
                }% utilization\n`;
            } else if (strategy > RiskStrategyLevels.MEDIUM) {
                requestDetailsText += `🚦 Strategy: 🔴 HIGH - ${strategy * 100}% utilization\n`;
            } else {
                throw new Error("Incorrect strategy value defined");
            }
        } else {
            requestDetailsText += `💲 Amount: ${amount} ${currency}\n`;
        }
        requestDetailsText += `🗓️ Creation date: ${creationDate}\n\n`;

        return escapeSpecialCharacters(
            "❌ *Previously created borrow request is unresolved* ❌\n\n" +
                "‼ You have already created a borrow request.\n\n" +
                "‼ XLine supports only one active request per credit line at a time.\n" +
                "‼ You can create a new request after the previous one is resolved.\n" +
                "💡 Please wait for the previous request to be resolved or contact our customer support team.\n\n" +
                requestDetailsText
        );
    }
}
