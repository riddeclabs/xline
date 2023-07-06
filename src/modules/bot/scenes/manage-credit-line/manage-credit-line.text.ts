import { EconomicalParameters } from "../../../../database/entities";
import { CreditLineDetails } from "../../../credit-line/credit-line.types";
import { bigintToFormattedPercent, escapeSpecialCharacters } from "../../../../common";
import { BasicSourceText } from "../common/basic-source.text";
import { getCreditLineStateMsgData } from "../common/utils";
import { CreditLineDetailsExt } from "../../bot-manager.service";

export class ManageCreditLineText extends BasicSourceText {
    static getChoseCreditLineText() {
        return {
            notFoundText:
                "🤷 *You don't have active credit lines\\.*\n\n" +
                "🆕 To open a new line use *\\`Open credit line\\`* tab from the main menu\\.",
            existLineText: "〽 *Chose the credit line you want to view*",
        };
    }

    static getViewLineDetailsText(creditLineDetailsExtended: CreditLineDetailsExt) {
        const vld = this.prepareViewLineData(
            creditLineDetailsExtended.economicalParams,
            creditLineDetailsExtended.lineDetails
        );
        const collateralSymbol = creditLineDetailsExtended.lineDetails.collateralCurrency.symbol;
        const debtSymbol = creditLineDetailsExtended.lineDetails.debtCurrency.symbol;

        const state = getCreditLineStateMsgData(creditLineDetailsExtended);
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
                `*Has been liquidated*:   ${state.hasBeenLiquidated}\n\n`
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
