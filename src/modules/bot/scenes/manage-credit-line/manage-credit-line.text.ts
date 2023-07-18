import { bigintToFormattedPercent, escapeSpecialCharacters } from "../../../../common";
import { BasicSourceText } from "../common/basic-source.text";
import { getCreditLineStateMsgData } from "../common/utils";
import { CreditLineWithExtras } from "../../bot-manager.service";
import { CreditLine } from "src/database/entities";

export class ManageCreditLineText extends BasicSourceText {
    static getChoseCreditLineText() {
        return {
            notFoundText:
                "🤷 *You don't have active credit lines\\.*\n\n" +
                "🆕 To open a new line use *\\`Open credit line\\`* tab from the main menu\\.",
            existLineText: "〽 *Chose the credit line you want to view*",
        };
    }

    static getViewLineDetailsText(clwe: CreditLineWithExtras) {
        const vld = this.prepareViewLineData(clwe);
        const collateralSymbol = clwe.collateralCurrency.symbol;
        const debtSymbol = clwe.debtCurrency.symbol;

        const state = getCreditLineStateMsgData(clwe);
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

    private static prepareViewLineData(cl: CreditLine) {
        return {
            mdAprPercent: bigintToFormattedPercent(cl.economicalParameters.apr),
            mdCollateralFactorPercent: bigintToFormattedPercent(
                cl.economicalParameters.collateralFactor
            ),
            mdLiquidationFactorPercent: bigintToFormattedPercent(
                cl.economicalParameters.liquidationFactor
            ),
            mdLiquidationFeePercent: bigintToFormattedPercent(cl.economicalParameters.liquidationFee),
        };
    }
}
