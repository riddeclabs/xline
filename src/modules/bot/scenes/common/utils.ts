import { bigintToFormattedPercent, formatUnitsNumber } from "src/common";
import { CreditLineDetailsExt } from "../../bot-manager.service";
import { CreditLineStateMsgData } from "./types";
import { EXP_SCALE } from "src/common/constants";
import { BasicSourceText } from "./basic-source.text";

export function getCreditLineState(cld: CreditLineDetailsExt): CreditLineStateMsgData {
    const maxAllowedBorrowAmount = formatUnitsNumber(
        (cld.lineDetails.fiatCollateralAmount * cld.economicalParams.collateralFactor) / EXP_SCALE -
            cld.lineDetails.debtAmount
    );

    return {
        supplyAmountCrypto: formatUnitsNumber(
            cld.lineDetails.rawCollateralAmount,
            cld.lineDetails.collateralCurrency.decimals
        ),
        supplyAmountFiat: truncateDecimals(formatUnitsNumber(cld.lineDetails.fiatCollateralAmount), 2),
        cryptoCurrency: cld.lineDetails.collateralCurrency.symbol,
        debtCurrency: cld.lineDetails.debtCurrency.symbol,
        debtAmount: formatUnitsNumber(cld.lineDetails.debtAmount),
        utilizationRatePercent: bigintToFormattedPercent(cld.lineDetails.utilizationRate),
        maxAllowedBorrowAmount: truncateDecimals(maxAllowedBorrowAmount, 2),
        liquidationRisk: BasicSourceText.getCurrentLiquidationRisk(
            cld.lineDetails.utilizationRate,
            cld.economicalParams.collateralFactor
        ),
        hasBeenLiquidated: cld.lineDetails.isLiquidated ? "Yes" : "No",
    };
}

export function truncateDecimals(value: number | string, decimals: number): number {
    const valueStr = typeof value === "string" ? value : value.toString();
    const dotIndex = valueStr.indexOf(".");
    if (dotIndex === -1) {
        return Number(valueStr);
    }
    const valueStrTruncated = valueStr.slice(0, dotIndex + decimals + 1);
    return Number(valueStrTruncated);
}
