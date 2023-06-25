import { EconomicalParameters } from "../../../../database/entities";
import { CreditLineDetails } from "../../../credit-line/credit-line.types";
import {
    bigintToFormattedPercent,
    escapeSpecialCharacters,
    formatUnitsNumber,
} from "../../../../common";
import { BasicSourceText } from "../common/basic-source.text";
import { getCreditLineState } from "../common/utils";

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
        const collateralSymbol = cld.collateralCurrency.symbol;
        const debtSymbol = cld.debtCurrency.symbol;

        const healthyFactorText =
            cld.healthyFactor === 0n
                ? ""
                : `Healthy Factor:    ${formatUnitsNumber(cld.healthyFactor)} \n`;

        const state = getCreditLineState({ economicalParams: ep, lineDetails: cld });
        const creditLineStateText = this.getCreditLineStateText(state);

        return escapeSpecialCharacters(
            `💶 *${collateralSymbol}/${debtSymbol} credit line details* \n\n` +
                "📊 *Applied rates:*\n" +
                `APR: ${vld.mdAprPercent} %\n` +
                `Collateral Factor: ${vld.mdCollateralFactorPercent} %\n` +
                `Liquidation Factor: ${vld.mdLiquidationFactorPercent} %\n` +
                `Liquidation Fee: ${vld.mdLiquidationFeePercent} %\n` +
                "\n\n" +
                "📊 *Credit details:*\n" +
                healthyFactorText +
                creditLineStateText
        );
    }

    private static prepareViewLineData(ep: EconomicalParameters, cld: CreditLineDetails) {
        return {
            mdAprPercent: bigintToFormattedPercent(ep.apr),
            mdCollateralFactorPercent: bigintToFormattedPercent(ep.collateralFactor),
            mdLiquidationFactorPercent: bigintToFormattedPercent(ep.liquidationFactor),
            mdLiquidationFeePercent: bigintToFormattedPercent(ep.liquidationFee),
        };
    }
}
