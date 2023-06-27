import { bigintToFormattedPercent, formatUnitsNumber, parseUnits } from "src/common";
import { CreditLineDetailsExt } from "../../bot-manager.service";
import { CreditLineStateMsgData } from "./types";
import { EXP_SCALE } from "src/common/constants";
import { BasicSourceText } from "./basic-source.text";
import { truncateDecimals } from "src/common/text-formatter";

export function getCreditLineStateData(cld: CreditLineDetailsExt): CreditLineStateMsgData {
    const maxAllowedBorrowAmount = getMaxAllowedBorrowAmount(cld);

    return {
        supplyAmountCrypto: formatUnitsNumber(
            cld.lineDetails.rawCollateralAmount,
            cld.lineDetails.collateralCurrency.decimals
        ),
        supplyAmountFiat: truncateDecimals(formatUnitsNumber(cld.lineDetails.fiatCollateralAmount), 2),
        cryptoCurrency: cld.lineDetails.collateralCurrency.symbol,
        debtCurrency: cld.lineDetails.debtCurrency.symbol,
        debtAmount: truncateDecimals(formatUnitsNumber(cld.lineDetails.debtAmount), 2),
        utilizationRatePercent: bigintToFormattedPercent(cld.lineDetails.utilizationRate),
        maxAllowedBorrowAmount: truncateDecimals(formatUnitsNumber(maxAllowedBorrowAmount), 2),
        liquidationRisk: BasicSourceText.getCurrentLiquidationRisk(
            cld.lineDetails.utilizationRate,
            cld.economicalParams.collateralFactor
        ),
        hasBeenLiquidated: cld.lineDetails.isLiquidated ? "Yes" : "No",
    };
}

export function getMaxAllowedBorrowAmount(cld: CreditLineDetailsExt): bigint {
    return (
        (cld.lineDetails.fiatCollateralAmount * cld.economicalParams.collateralFactor) / EXP_SCALE -
        (cld.lineDetails.debtAmount * (parseUnits("1") - cld.economicalParams.fiatProcessingFee)) /
            EXP_SCALE
    );
}
