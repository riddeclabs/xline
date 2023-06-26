import { bigintToFormattedPercent, formatUnitsNumber } from "src/common";
import { CreditLineDetailsExt } from "../../bot-manager.service";
import {
    CreditLineStateMsgData,
    CryptoTxMsgData,
    FiatTxMsgData,
    XLineRequestMsgData,
    XLineRequestsTypes,
    isBorrowRequest,
    isDepositRequest,
    isRepayRequest,
    isWithdrawRequest,
} from "./types";
import { EXP_SCALE } from "src/common/constants";
import { BasicSourceText } from "./basic-source.text";
import {
    CollateralCurrency,
    CryptoTransaction,
    DebtCurrency,
    FiatTransaction,
} from "src/database/entities";
import { truncateDecimals } from "src/common/text-formatter";
export function getFiatTxMsgData(tx: FiatTransaction, currency: DebtCurrency): FiatTxMsgData {
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

export function getCryptoTxMsgData(
    tx: CryptoTransaction,
    currency: CollateralCurrency
): CryptoTxMsgData {
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

export function getCreditLineStateMsgData(cld: CreditLineDetailsExt): CreditLineStateMsgData {
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
            cld.lineDetails.utilizationRate * 100n,
            cld.economicalParams.collateralFactor
        ),
        hasBeenLiquidated: cld.lineDetails.isLiquidated ? "Yes" : "No",
    };
}
export { XLineRequestsTypes };
