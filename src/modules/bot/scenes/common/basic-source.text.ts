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
            ? `Max to borrow:    ${data.maxAllowedAmount} ${data.fiatCurrency}\n`
            : "";
        return (
            `Deposit amount: ${data.supplyCrypto} ${data.cryptoCurrency} / ${data.supplyFiat} ${data.fiatCurrency}\n` +
            `Debt amount:      ${data.debtAmount} ${data.fiatCurrency}\n` +
            `Utilization rate:    ${data.utilizationRatePercent}%\n` +
            maxAllowedText +
            `Liquidation risk:    ${data.liquidationRisk}\n` +
            `Been liquidated:   ${data.hasBeenLiquidated}\n`
        );
    }

    static getRequisitesText(requisites: Requisites): string {
        return (
            "*Bank requisites*\n" + `IBAN:   ${requisites.iban}\n` + `Name:  ${requisites.accountName}\n`
        );
    }

    static getBorrowRequestMsgText(data: XLineRequestMsgData): string {
        const msgHeader = "*Borrow request*\n\n";

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
            msgHeader +
            `Status: ${data.status}\n` +
            borrowAmountText +
            requisitesText +
            "\n" +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getDepositRequestMsgText(data: XLineRequestMsgData): string {
        const msgHeader = "*Deposit request*\n\n";

        if (data.amountOrStrategy || data.requisitesOrWallet) {
            throw new Error("Invalid deposit request");
        }

        return (
            msgHeader +
            `Status: ${data.status}\n\n` +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getWithdrawRequestMsgText(data: XLineRequestMsgData): string {
        const msgHeader = "*Withdraw request*\n\n";

        if (typeof data.amountOrStrategy !== "number" || typeof data.requisitesOrWallet !== "string") {
            throw new Error("Invalid withdraw request");
        }

        return (
            msgHeader +
            `Status: ${data.status}\n` +
            `Withdraw amount: ${data.amountOrStrategy} ${data.currency}\n\n` +
            "*Requisites*\n" +
            `Wallet: ${data.requisitesOrWallet}\n\n` +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getRepayRequestMsgText(data: XLineRequestMsgData): string {
        if (data.amountOrStrategy || typeof data.requisitesOrWallet !== "object") {
            throw new Error("Invalid repay request");
        }

        return (
            "*Repay request*\n\n" +
            `Status: ${data.status}\n` +
            "*Bank requisites*\n" +
            `IBAN: ${data.requisitesOrWallet.iban}\n` +
            `Account Name: ${data.requisitesOrWallet.accountName}\n\n` +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getFiatProcessingFeeText(fee: bigint | number, amount: number, fiatCurrency: string): string {
        const feeNum = typeof fee === "number" ? fee : formatUnitsNumber(fee);
        const feeAmount = truncateDecimals(feeNum * amount, 2);
        return `*Processing fee:* ${feeAmount} ${fiatCurrency}\n`;
    }
}
