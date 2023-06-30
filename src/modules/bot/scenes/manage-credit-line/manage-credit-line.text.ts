import { EconomicalParameters } from "../../../../database/entities";
import { CreditLineDetails } from "../../../credit-line/credit-line.types";
import { bigintToFormattedPercent, escapeSpecialCharacters } from "../../../../common";
import { BasicSourceText } from "../common/basic-source.text";
import { getCreditLineStateMsgData } from "../common/utils";

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

        const state = getCreditLineStateMsgData({ economicalParams: ep, lineDetails: cld });
        const creditLineStateText = this.getCreditLineStateText(state, false);

        return escapeSpecialCharacters(
            `💶 *${collateralSymbol}/${debtSymbol} credit line details* \n\n` +
                "📊 *Applied rates:*\n" +
                `APR: ${vld.mdAprPercent} %\n` +
                `Collateral Factor: ${vld.mdCollateralFactorPercent} %\n\n` +
                `Liquidation Factor: ${vld.mdLiquidationFactorPercent} %\n` +
                `Liquidation Fee: ${vld.mdLiquidationFeePercent} %\n` +
                "\n\n" +
                "📊 *Credit details:*\n" +
                creditLineStateText +
                `Been liquidated:   ${state.hasBeenLiquidated}\n\n`
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
