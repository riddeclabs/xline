import { formatUnitsNumber } from "src/common";
import { RiskStrategyLevels } from "../new-credit-request/new-credit-request.types";
import { CreditLineStateMsgData, Requisites, XLineRequestMsgData } from "./types";
import { truncateDecimals } from "./utils";

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

    static getRiskStrategyText(riskStrategy: bigint | number): string {
        const rs = typeof riskStrategy === "number" ? riskStrategy : formatUnitsNumber(riskStrategy);

        if (rs === RiskStrategyLevels.LOW) {
            return `🟢 LOW - ${rs * 100}% utilization`;
        } else if (rs === RiskStrategyLevels.MEDIUM) {
            return `🟠 MEDIUM - ${rs * 100}% utilization`;
        } else if (rs > RiskStrategyLevels.MEDIUM) {
            return `🔴 HIGH - ${rs * 100}% utilization`;
        } else {
            throw new Error("Incorrect strategy value defined");
        }
    }

    static getCreditLineStateText(data: CreditLineStateMsgData, printMaxAllowed = true): string {
        const maxAllowedText = printMaxAllowed
            ? `Max to borrow:    ${data.maxAllowedBorrowAmount} ${data.debtCurrency}\n`
            : "";
        return (
            `Deposit amount: ${data.supplyAmountCrypto} ${data.cryptoCurrency} / ${data.supplyAmountFiat} ${data.debtCurrency}\n` +
            `Debt amount:      ${data.debtAmount} ${data.debtCurrency}\n` +
            `Utilization rate:    ${data.utilizationRatePercent}%\n` +
            maxAllowedText +
            `Liquidation risk:    ${data.liquidationRisk}\n` +
            `Been liquidated:   ${data.hasBeenLiquidated}\n`
        );
    }

    static getRequisitesText(requisites: Requisites): string {
        return (
            "🏦 *Bank requisites*\n" + `IBAN:   ${requisites.iban}\n` + `Name:  ${requisites.accountName}\n`
        );
    }

    static getBorrowRequestMsgText(data: XLineRequestMsgData): string {
        if (!data.amountOrStrategy || typeof data.requisitesOrWallet !== "object") {
            throw new Error("Invalid borrow request");
        }

        let borrowAmountText;
        if (typeof data.amountOrStrategy === "string") {
            borrowAmountText = `Strategy: ${data.amountOrStrategy}\n\n`;
        } else {
            borrowAmountText = `Borrow amount: ${data.amountOrStrategy} ${data.currency}\n\n`;
        }

        const requisitesText = BasicSourceText.getRequisitesText(data.requisitesOrWallet);

        return (
            "*Borrow request*\n" +
            `Status: ${data.status}\n` +
            borrowAmountText +
            requisitesText +
            "\n" +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getFiatProcessingFeeText(fee: bigint | number, amount: number, fiatCurrency: string): string {
        const feeNum = typeof fee === "number" ? fee : formatUnitsNumber(fee);
        const feeAmount = truncateDecimals(feeNum * amount, 2);
        return `*💸 Processing fee:* ${feeAmount} ${fiatCurrency}\n`;
    }
}
