import { escapeSpecialCharacters } from "src/common";

export class BorrowTextSource {
    static getBorrowTermsText(maxCollateral: number, processingFee: number): string {
        return escapeSpecialCharacters(
            "*Borrow info*\n\n" +
                "📝 The Borrow allows you to increase your debt position.\n\n" +
                "After confirmation of your request by the system, the requested amount of USD will be sent to your IBAN\n\n" +
                "⚠️ Be careful! \n" +
                "Borrow operation increases the utilization rate of your position and increases the risk of liquidation.\n\n" +
                `The total debt for your position cannot exceed ${maxCollateral}% of the remaining deposit.` +
                `⚠️ ${processingFee}% of borrowable amount will be apply as processing fee.` +
                "An amount equal to the fee will be added to your debt position."
        );
    }

    static getAmountInputText(
        depositCrypto: number,
        depositFiat: number,
        cryptoCurrency: string,
        fiatCurrency: string,
        debtAmount: number,
        utilizationRate: number,
        maxUtilizationRate: number,
        maxAllowedAmount: number
    ): string {
        return escapeSpecialCharacters(
            `*Please enter ${fiatCurrency} amount you want to borrow*\n\n` +
                "Current state:\n" +
                `Deposit amount: ${depositCrypto} ${cryptoCurrency} / ${depositFiat} ${fiatCurrency}\n` +
                `Debt amount: ${debtAmount} ${fiatCurrency}\n` +
                `Utilization rate: ${utilizationRate}%\n` +
                `Max utilization rate: ${maxUtilizationRate}%\n\n` +
                `Max allowed amount to borrow: ${maxAllowedAmount} ${fiatCurrency}\n\n` +
                `Max accuracy for USD value ia 1 cent.`
        );
    }

    static getSignTermsText(
        depositCrypto: number,
        depositFiat: number,
        cryptoCurrency: string,
        fiatCurrency: string,
        debtAmountBefore: number,
        utilizationRateBefore: number,
        debtAmountAfter: number,
        utilizationRateAfter: number,
        liquidationRiskBefore: string,
        liquidationRiskAfter: string,
        name: string,
        iban: string
    ): string {
        return escapeSpecialCharacters(
            "*Borrow request details*\n\n" +
                "You have requested 15 000 USD to borrow.\n\n" +
                "Old state:\n" +
                `Deposit amount: ${depositCrypto} ${cryptoCurrency} / ${depositFiat} ${fiatCurrency}\n` +
                `Debt amount: ${debtAmountBefore} ${fiatCurrency}\n` +
                `Utilization rate: ${utilizationRateBefore}%\n` +
                `Liquidation risk: ${liquidationRiskBefore}\n\n` +
                "New state:\n" +
                `Deposit amount: ${depositCrypto} ${cryptoCurrency} / ${depositFiat} ${fiatCurrency}\n` +
                `Debt amount: ${debtAmountAfter} ${fiatCurrency}\n` +
                `Utilization rate: ${utilizationRateAfter}%\n` +
                `Liquidation risk: ${liquidationRiskAfter}\n\n` +
                `Holder name: ${name}\n` +
                `IBAN: ${iban}\n\n` +
                "❗️ After you agree to our offer, we will send requested USD amount to your bank account"
        );
    }

    static getBorrowSuccessText(name: string, iban: string): string {
        return escapeSpecialCharacters(
            "✅ Done! You've created 'Borrow' request.\n\n" +
                "We will send requested USD amount to your bank account\n\n" +
                `Holder name: ${name}\n` +
                `IBAN: ${iban}\n\n` +
                "You always can check all you request details.\n" +
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
}
