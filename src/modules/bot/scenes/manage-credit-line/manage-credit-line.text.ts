import { EconomicalParameters } from "../../../../database/entities";
import { CreditLineDetails } from "../../../credit-line/credit-line.types";
import { bigintToFormattedPercent, formatUnits } from "../../../../common";
import { truncateDecimal } from "../../../../common/text-formatter";
import { BasicSourceText } from "../common/basic-source.text";

export class ManageCreditLineText extends BasicSourceText {
    static getChoseCreditLineText() {
        return {
            notFoundText:
                "🤷 *You don't have active credit lines\\.*\n\n" +
                "🆕 To open a new line use *\\`Open credit line\\`* tab from the main menu\\.",
            existLineText: "〽 *Chose the credit line you want to view*",
        };
    }

    static getViewLineDetailsText(ep: EconomicalParameters, cld: CreditLineDetails) {
        const vld = this.prepareViewLineData(ep, cld);
        const collateralSymbol = cld.collateralToken.symbol;
        const debtSymbol = cld.debtToken.symbol;

        const healthyFactorText =
            cld.healthyFactor === 0n
                ? ""
                : `Healthy Factor: ${bigintToFormattedPercent(cld.healthyFactor, 3)}}\n`;
        const liquidationRiskText = this.getCurrentLiquidationRisk(
            cld.utilizationRate,
            ep.collateralFactor
        );

        const liquidatedStatusText = cld.isLiquidated ? "Yes" : "No";

        return (
            `💶 *${collateralSymbol}/${debtSymbol} credit line details* \n\n` +
            "📊 *Applied rates:*\n" +
            `APR: ${vld.mdAprPercent} %\n` +
            `Collateral Factor: ${vld.mdCollateralFactorPercent} %\n` +
            `Liquidation Factor: ${vld.mdLiquidationFactorPercent} %\n` +
            `Liquidation Fee: ${vld.mdLiquidationFeePercent} %\n` +
            "\n\n" +
            "📊 *Credit details:*\n" +
            healthyFactorText +
            `Utilization Rate: ${vld.mdUtilizationRatePercent} %\n` +
            `Total fee accumulated: ${vld.mdFeeAccumulatedFiatAmount} ${debtSymbol}\n` +
            `Deposit amount: ${vld.mdFiatCollateralAmount} ${debtSymbol} / ${vld.mdRawCollateralAmount} ${collateralSymbol}\n` +
            `Debt amount: ${vld.mdDebtAmount} ${debtSymbol}\n` +
            "\n" +
            `*Has been liquidated*: ${liquidatedStatusText} \n` +
            `*Liquidation risk*:    ${liquidationRiskText}`
        );
    }

    private static prepareViewLineData(ep: EconomicalParameters, cld: CreditLineDetails) {
        return {
            mdAprPercent: bigintToFormattedPercent(ep.apr),
            mdCollateralFactorPercent: bigintToFormattedPercent(ep.collateralFactor),
            mdLiquidationFactorPercent: bigintToFormattedPercent(ep.liquidationFactor),
            mdLiquidationFeePercent: bigintToFormattedPercent(ep.liquidationFee),
            mdUtilizationRatePercent: bigintToFormattedPercent(cld.utilizationRate),
            mdFeeAccumulatedFiatAmount: truncateDecimal(formatUnits(cld.feeAccumulatedFiatAmount)),
            mdFiatCollateralAmount: truncateDecimal(formatUnits(cld.fiatCollateralAmount)),
            mdRawCollateralAmount: truncateDecimal(
                formatUnits(cld.rawCollateralAmount, cld.collateralToken.decimals)
            ),
            mdDebtAmount: truncateDecimal(formatUnits(cld.debtAmount)),
        };
    }
}
