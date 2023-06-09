import { formatUnitsNumber } from "src/common";
import { RiskStrategyLevels } from "../new-credit-request/new-credit-request.types";

export abstract class BasicSourceText {
    static getCurrentLiquidationRisk(
        rawUtilRate: bigint | number,
        rawCollateralFactor: bigint | number
    ) {
        const utilRate = typeof rawUtilRate === "number" ? rawUtilRate : formatUnitsNumber(rawUtilRate);
        const collateralFactor =
            typeof rawCollateralFactor === "number"
                ? rawCollateralFactor
                : formatUnitsNumber(rawCollateralFactor);

        if (utilRate <= RiskStrategyLevels.MEDIUM) {
            return "🟢 LOW";
        }
        if (utilRate <= collateralFactor) {
            return "🟠 MEDIUM";
        }
        return "🔴 HIGH";
    }
}
