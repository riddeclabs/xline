import { bigintToFormattedPercent, formatUnitsNumber } from "src/common";
import { CreditLineDetailsExt } from "../../bot-manager.service";
import { CreditLineStateMsgData, XLineRequestMsgData } from "./types";
import { EXP_SCALE } from "src/common/constants";
import { BasicSourceText } from "./basic-source.text";
import { BorrowRequest, DepositRequest, RepayRequest, WithdrawRequest } from "src/database/entities";

export function getCreditLineStateMsgData(cld: CreditLineDetailsExt): CreditLineStateMsgData {
    const maxAllowedBorrowAmount = formatUnitsNumber(
        (cld.lineDetails.fiatCollateralAmount * cld.economicalParams.collateralFactor) / EXP_SCALE -
            cld.lineDetails.debtAmount
    );

    return {
        supplyCrypto: formatUnitsNumber(
            cld.lineDetails.rawCollateralAmount,
            cld.lineDetails.collateralCurrency.decimals
        ),
        supplyFiat: truncateDecimals(formatUnitsNumber(cld.lineDetails.fiatCollateralAmount), 2),
        cryptoCurrency: cld.lineDetails.collateralCurrency.symbol,
        fiatCurrency: cld.lineDetails.debtCurrency.symbol,
        debtAmount: formatUnitsNumber(cld.lineDetails.debtAmount),
        utilizationRatePercent: bigintToFormattedPercent(cld.lineDetails.utilizationRate),
        maxAllowedAmount: truncateDecimals(maxAllowedBorrowAmount, 2),
        liquidationRisk: BasicSourceText.getCurrentLiquidationRisk(
            cld.lineDetails.utilizationRate,
            cld.economicalParams.collateralFactor
        ),
        hasBeenLiquidated: cld.lineDetails.isLiquidated ? "yes" : "no",
    };
}

export type XLineRequestsTypes = BorrowRequest | DepositRequest | RepayRequest | WithdrawRequest;

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

export function isBorrowRequest(req: XLineRequestsTypes): req is BorrowRequest {
    return "borrowRequestStatus" in req;
}

export function isDepositRequest(req: XLineRequestsTypes): req is DepositRequest {
    return "depositRequestStatus" in req;
}

export function isRepayRequest(req: XLineRequestsTypes): req is RepayRequest {
    return "repayRequestStatus" in req;
}

export function isWithdrawRequest(req: XLineRequestsTypes): req is WithdrawRequest {
    return "withdrawRequestStatus" in req;
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
