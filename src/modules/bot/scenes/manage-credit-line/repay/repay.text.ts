import { CreditLineDetails } from "../../../../credit-line/credit-line.types";
import { truncateDecimalsToStr } from "../../../../../common/text-formatter";
import { bigintToFormattedPercent, escapeSpecialCharacters, formatUnits } from "../../../../../common";
import { BusinessPaymentRequisite } from "../../../../../database/entities";

export class RepayTextSource {
    static getVerifyPendingRequestText(
        businessPaymentRequisite: BusinessPaymentRequisite,
        refNumber: string
    ) {
        return escapeSpecialCharacters(
            "‼ You already have pending *'Repay'* request.\n" +
                "\n" +
                "📧 You can just use the provided bank details to make a payment (click on requisite to copy)\n\n" +
                `🏦 Bank name: \`${businessPaymentRequisite.bankName}\`\n` +
                `💳 IBAN: \`${businessPaymentRequisite.iban}\`\n` +
                "\n" +
                `📭 Please use your personal reference number: \`${refNumber}\` \n` +
                "\n" +
                "You always can check all you request details.\n" +
                "To do this, go to *'View my requests'* tab from the *main menu*."
        );
    }
    static getRepayInfoText(creditLineDetails: CreditLineDetails) {
        const cld = this.prepareCreditLineData(creditLineDetails);
        return escapeSpecialCharacters(
            "📜 *REPAY TERMS*\n\n" +
                "📝 The Repay allows you to decrease your debt position and risk of liquidation by reducing the utilization factor of your debt position.\n" +
                "\n" +
                `📈 *Your current credit state*\n` +
                `Deposit amount: ${cld.mdDepositAmountUsd} ${cld.mdDebtSymbol} / ${cld.mdDepositAmountRaw} ${cld.mdCollateralSymbol} \n` +
                `Debt amount: ${cld.mdDebtAmount} ${cld.mdDebtSymbol} \n` +
                "\n" +
                `Healthy Factor: ${cld.mdHealthyFactor}\n` +
                `Utilization Rate: ${cld.mdUtilizationRate} %\n` +
                "\n" +
                `✅ After confirmation, we will provide you with the *IBAN* you need to send repay amount to.`
        );
    }

    static getApproveRepayRequest(
        businessPaymentRequisite: BusinessPaymentRequisite,
        refNumber: string
    ) {
        return escapeSpecialCharacters(
            "✅ *Done! You've created new Repay request!* \n\n" +
                "Please use the bank details provided to make the payment (click on requisite to copy)\n\n" +
                `🏦 Bank name: \`${businessPaymentRequisite.bankName}\`\n` +
                `💳 IBAN: \`${businessPaymentRequisite.iban}\`\n` +
                "\n" +
                `📭 Please use your personal reference number: \`${refNumber}\` \n` +
                "\n" +
                "You always can check all you request details. \n" +
                "To do this, go to *'View my requests'* tab from the *main menu*."
        );
    }

    static getRejectRepayText() {
        return escapeSpecialCharacters(
            "❌ *Repay Request Rejected* ❌\n\n" +
                "We have received confirmation that you've rejected the request to repay.\n" +
                "If you have any questions or need further assistance, please contact our customer support team.\n"
        );
    }

    private static prepareCreditLineData(creditLineDetails: CreditLineDetails) {
        return {
            mdDebtSymbol: creditLineDetails.debtCurrency.symbol,
            mdCollateralSymbol: creditLineDetails.collateralCurrency.symbol,
            mdDepositAmountUsd: truncateDecimalsToStr(
                formatUnits(creditLineDetails.fiatCollateralAmount)
            ),
            mdDepositAmountRaw: truncateDecimalsToStr(
                formatUnits(
                    creditLineDetails.rawCollateralAmount,
                    creditLineDetails.collateralCurrency.decimals
                )
            ),
            mdDebtAmount: truncateDecimalsToStr(formatUnits(creditLineDetails.debtAmount)),
            mdHealthyFactor: truncateDecimalsToStr(formatUnits(creditLineDetails.healthyFactor)),
            mdUtilizationRate: bigintToFormattedPercent(creditLineDetails.utilizationRate),
        };
    }
}
