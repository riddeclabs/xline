import { formatUnitsNumber } from "src/common";
import { RiskStrategyLevels } from "../new-credit-request/new-credit-request.types";
import {
    CreditLineStateMsgData,
    CryptoTxMsgData,
    FiatTxMsgData,
    Requisites,
    XLineRequestMsgData,
} from "./types";
import { truncateDecimals } from "src/common/text-formatter";

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

    static getCreditLineStateText(data: CreditLineStateMsgData, printMaxAllowed: boolean): string {
        const maxAllowedText = printMaxAllowed
            ? `\n🎯 *Max allowed amount to borrow:* ${data.maxAllowedBorrowAmount} ${data.debtCurrency}\n`
            : "";
        return (
            `Deposit amount: ${data.supplyAmountCrypto} ${data.cryptoCurrency} / ${data.supplyAmountFiat} ${data.debtCurrency}\n` +
            `Debt amount:       ${data.debtAmount} ${data.debtCurrency}\n` +
            `Utilization rate:    ${data.utilizationRatePercent}%\n` +
            `Liquidation risk:   ${data.liquidationRisk}\n` +
            maxAllowedText
        );
    }

    static getRequisitesText(requisites: Requisites): string {
        return (
            "🏦 *Bank requisites*\n" +
            `IBAN:   ${requisites.iban}\n` +
            `Name:  ${requisites.accountName}\n`
        );
    }

    static getBorrowRequestMsgText(data: XLineRequestMsgData): string {
        const msgHeader = "⬅️ *Borrow request*\n\n";

        if (!data.amountOrStrategy || typeof data.requisitesOrWallet !== "object") {
            throw new Error("Invalid borrow request");
        }

        let borrowAmountText;
        if (typeof data.amountOrStrategy === "string") {
            borrowAmountText = `📈 Strategy: ${data.amountOrStrategy}\n\n`;
        } else {
            borrowAmountText = `💵 Borrow amount: ${data.amountOrStrategy} ${data.currency}\n\n`;
        }

        const requisitesText = BasicSourceText.getRequisitesText(data.requisitesOrWallet);

        return (
            msgHeader +
            `ℹ️ Status: ${data.status}\n\n` +
            borrowAmountText +
            requisitesText +
            "\n" +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getDepositRequestMsgText(data: XLineRequestMsgData): string {
        const msgHeader = "➡️ *Deposit request*\n\n";

        if (data.amountOrStrategy || data.requisitesOrWallet) {
            throw new Error("Invalid deposit request");
        }

        return (
            msgHeader +
            `ℹ️ Status: ${data.status}\n\n` +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getWithdrawRequestMsgText(data: XLineRequestMsgData): string {
        const msgHeader = "↩️ *Withdraw request*\n\n";

        if (typeof data.amountOrStrategy !== "number" || typeof data.requisitesOrWallet !== "string") {
            throw new Error("Invalid withdraw request");
        }

        return (
            msgHeader +
            `ℹ️ Status: ${data.status}\n\n` +
            `💵 Withdraw amount: ${data.amountOrStrategy} ${data.currency}\n\n` +
            "📬 *Requisites*\n" +
            `Wallet: ${data.requisitesOrWallet}\n\n` +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getRepayRequestMsgText(data: XLineRequestMsgData): string {
        const msgHeader = "↪️ *Repay request*\n\n";

        if (data.amountOrStrategy || typeof data.requisitesOrWallet !== "object") {
            throw new Error("Invalid repay request");
        }

        const requisitesText = BasicSourceText.getRequisitesText(data.requisitesOrWallet);

        return (
            msgHeader +
            `ℹ️ Status: ${data.status}\n\n` +
            requisitesText +
            "\n" +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getFiatProcessingFeeText(fee: bigint | number, amount: number, fiatCurrency: string): string {
        const feeNum = typeof fee === "number" ? fee : formatUnitsNumber(fee);
        const feeAmount = truncateDecimals(feeNum * amount, 2);
        return `💸 *Processing fee:* ${feeAmount} ${fiatCurrency}\n`;
    }

    static getFiatTxMsgText(data: FiatTxMsgData, num?: number): string {
        let msgHeader = "🧾 *Fiat transaction*";
        if (num) {
            msgHeader += ` [${num}]`;
        }
        return (
            msgHeader +
            "\n\n" +
            `ℹ️ Status: ${data.status}\n\n` +
            `💵 Amount: ${data.amount} ${data.currency}\n\n` +
            "🛸 *From:*\n" +
            `Name: ${data.nameFrom}\n` +
            `IBAN: ${data.ibanFrom}\n\n` +
            "🦄 *To:*\n" +
            `Name: ${data.nameTo}\n` +
            `IBAN: ${data.ibanTo}\n\n` +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }

    static getCryptoTxMsgText(data: CryptoTxMsgData, num?: number): string {
        let msgHeader = "🧾 *Crypto transaction*";
        if (num) {
            msgHeader += ` [${num}]`;
        }
        return (
            msgHeader +
            "\n\n" +
            `*TxHash:* ${data.txHash}\n` +
            `*Amount:* ${data.amount} ${data.currency}\n\n` +
            `Created: ${data.created}\n` +
            `Updated: ${data.updated}\n\n`
        );
    }
}
