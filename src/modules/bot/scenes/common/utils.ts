import { bigintToFormattedPercent, formatUnitsNumber } from "src/common";
import { CreditLineWithExtras } from "../../bot-manager.service";
import {
    CreditLineStateMsgData,
    CryptoTxMsgData,
    FiatTxMsgData,
    RatesMsgData,
    XLineRequestMsgData,
    XLineRequestsTypes,
    isBorrowRequest,
    isDepositRequest,
    isRepayRequest,
    isWithdrawRequest,
} from "./types";
import { BasicSourceText } from "./basic-source.text";
import {
    CollateralCurrency,
    CryptoTransaction,
    DebtCurrency,
    EconomicalParameters,
    FiatTransaction,
} from "src/database/entities";
import { truncateDecimals } from "src/common/text-formatter";
function getFiatTxMsgData(tx: FiatTransaction, currency: DebtCurrency): FiatTxMsgData {
    return {
        ibanFrom: tx.ibanFrom,
        ibanTo: tx.ibanTo,
        nameFrom: tx.nameFrom,
        nameTo: tx.nameTo,
        amount: formatUnitsNumber(tx.rawTransferAmount),
        currency: currency.symbol,
        status: tx.status,
        created: tx.createdAt.toDateString(),
        updated: tx.updatedAt.toDateString(),
    };
}

function getCryptoTxMsgData(tx: CryptoTransaction, currency: CollateralCurrency): CryptoTxMsgData {
    return {
        txHash: tx.txHash,
        amount: formatUnitsNumber(tx.rawTransferAmount, currency.decimals),
        currency: currency.symbol,
        created: tx.createdAt.toDateString(),
        updated: tx.updatedAt.toDateString(),
    };
}

// TODO: Explanation about join
export function getXLineRequestMsgData(request: XLineRequestsTypes): XLineRequestMsgData {
    if (isBorrowRequest(request)) {
        const data: XLineRequestMsgData = {
            status: request.borrowRequestStatus as string,
            currency: request.creditLine.debtCurrency.symbol,

            requisitesOrWallet: {
                iban: request.creditLine.userPaymentRequisite.iban,
                accountName: request.creditLine.user.name,
            },
            created: request.createdAt.toDateString(),
            updated: request.updatedAt.toDateString(),
        };

        if (request?.initialRiskStrategy) {
            data.amountOrStrategy = BasicSourceText.getRiskStrategyText(request.initialRiskStrategy);
        } else if (request?.borrowFiatAmount) {
            data.amountOrStrategy = formatUnitsNumber(request.borrowFiatAmount);
        }
        return data;
    } else if (isDepositRequest(request)) {
        return {
            status: request.depositRequestStatus as string,
            currency: request.creditLine.collateralCurrency.symbol,
            created: request.createdAt.toDateString(),
            updated: request.updatedAt.toDateString(),
        };
    } else if (isRepayRequest(request)) {
        return {
            status: request.repayRequestStatus as string,
            currency: request.creditLine.debtCurrency.symbol,
            requisitesOrWallet: {
                iban: request.creditLine.userPaymentRequisite.iban,
                accountName: request.creditLine.user.name,
            },
            created: request.createdAt.toDateString(),
            updated: request.updatedAt.toDateString(),
        };
    } else if (isWithdrawRequest(request)) {
        return {
            status: request.withdrawRequestStatus as string,
            currency: request.creditLine.collateralCurrency.symbol,
            amountOrStrategy: formatUnitsNumber(
                request.withdrawAmount,
                request.creditLine.collateralCurrency.decimals
            ),
            requisitesOrWallet: request.walletToWithdraw,
            created: request.createdAt.toDateString(),
            updated: request.updatedAt.toDateString(),
        };
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = request;
        throw new Error("Unrecognized request type");
    }
}

export function getTxDataForRequest(request: XLineRequestsTypes): FiatTxMsgData[] | CryptoTxMsgData[] {
    let associatedTxsData: FiatTxMsgData[] | CryptoTxMsgData[] = [];

    if (isBorrowRequest(request) || isRepayRequest(request)) {
        const fiatTxs = request.fiatTransactions;
        if (fiatTxs) {
            associatedTxsData = fiatTxs.map(tx =>
                getFiatTxMsgData(tx, request!.creditLine.debtCurrency)
            );
        }
    } else if (isDepositRequest(request) || isWithdrawRequest(request)) {
        const cryptoTxs = request.cryptoTransactions;
        if (cryptoTxs) {
            associatedTxsData = cryptoTxs.map(tx =>
                getCryptoTxMsgData(tx, request!.creditLine.collateralCurrency)
            );
        }
    } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = request;
        throw new Error(`Request type is not supported`);
    }
    return associatedTxsData;
}

export function getCreditLineStateMsgData(clwe: CreditLineWithExtras): CreditLineStateMsgData {
    return {
        depositAmountCrypto: formatUnitsNumber(clwe.rawDepositAmount, clwe.collateralCurrency.decimals),
        depositAmountFiat: truncateDecimals(formatUnitsNumber(clwe.fiatDepositAmount), 2),
        collateralCurrency: clwe.collateralCurrency.symbol,
        debtCurrency: clwe.debtCurrency.symbol,
        debtAmount: truncateDecimals(formatUnitsNumber(clwe.debtAmount), 2),
        utilizationRatePercent: bigintToFormattedPercent(clwe.utilizationRate),
        maxAllowedBorrowAmount: truncateDecimals(formatUnitsNumber(clwe.maxAllowedBorrowAmount), 2),
        liquidationRisk: BasicSourceText.getCurrentLiquidationRisk(
            clwe.utilizationRate,
            clwe.economicalParameters.collateralFactor
        ),
        hasBeenLiquidated: clwe.isLiquidated ? "Yes" : "No",
    };
}

export function getRatesMsgData(ep: EconomicalParameters): RatesMsgData {
    return {
        collateralCurrency: ep.collateralCurrency.symbol,
        debtCurrency: ep.debtCurrency.symbol,
        apr: bigintToFormattedPercent(ep.apr),
        collateralFactor: bigintToFormattedPercent(ep.collateralFactor),
        liquidationFactor: bigintToFormattedPercent(ep.liquidationFactor),
        liquidationFee: bigintToFormattedPercent(ep.liquidationFee),
        minCryptoProcessingFee: formatUnitsNumber(ep.minCryptoProcessingFeeFiat),
        minFiatProcessingFee: formatUnitsNumber(ep.minFiatProcessingFee),
        cryptoProcessingFeePercent: bigintToFormattedPercent(ep.cryptoProcessingFee),
        fiatProcessingFeePercent: bigintToFormattedPercent(ep.fiatProcessingFee),
    };
}
