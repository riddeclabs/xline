import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ResolveCryptoBasedRequestDto, ResolveFiatBasedRequestDto } from "./dto/resolve-request.dto";
import { RequestHandlerService } from "../request-handler/request-handler.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { RiskEngineService } from "../risk-engine/risk-engine.service";
import {
    ActionTypes,
    BorrowRequestStatus,
    DepositRequestStatus,
    parseUnits,
    RepayRequestStatus,
    WithdrawRequestStatus,
} from "../../common";
import { TransactionService } from "../transaction/transaction.service";
import { CurrencyService } from "../currency/currency.service";
import {
    BorrowRequest,
    CollateralCurrency,
    CreditLine,
    DepositRequest,
    RepayRequest,
    WithdrawRequest,
} from "../../database/entities";
import { CallbackTypes } from "../payment-processing/constants";
import { EXP_SCALE } from "../../common/constants";
import { PriceOracleService } from "../price-oracle/price-oracle.service";

@Injectable()
export class RequestResolverService {
    constructor(
        private requestHandlerService: RequestHandlerService,
        private creditLineService: CreditLineService,
        private riskEngineService: RiskEngineService,
        private transactionService: TransactionService,
        private currencyService: CurrencyService,
        private priceOracleService: PriceOracleService
    ) {}

    // Used by operator to resolve pending borrow request after fiat payment occurs.
    async resolveBorrowRequest(resolveBorrowRequest: ResolveFiatBasedRequestDto) {
        // Accrue interest
        // FIXME: add risk engine call

        const { request, creditLine } = await this.getRequestAndCreditLine(
            resolveBorrowRequest.requestId,
            ActionTypes.BORROW
        );

        if (!(request instanceof BorrowRequest)) {
            throw new Error("Incorrect request received");
        }

        if (BigInt(resolveBorrowRequest.rawTransferAmount) !== request.borrowFiatAmount) {
            throw new Error("Incorrect rawTransferAmount amount for fiat transaction");
        }

        const requestedBorrowAmount = await this.getBorrowAmount(
            request,
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawCollateralAmount
        );

        // Verify borrow request
        await this.riskEngineService.verifyBorrowOrThrow(
            creditLine,
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            requestedBorrowAmount
        );

        // Increase debt amount for borrow request
        await this.creditLineService.increaseDebtAmountById(creditLine, requestedBorrowAmount);

        // Update status for borrow req
        const updatedRequest = await this.requestHandlerService.updateBorrowReqStatus(
            request.id,
            BorrowRequestStatus.FINISHED
        );

        // Create new FiatTransaction
        const transaction = await this.transactionService.createFiatTransaction({
            ...resolveBorrowRequest,
            borrowRequestId: request.id,
            repayRequestId: null,
            rawTransferAmount: BigInt(resolveBorrowRequest.rawTransferAmount),
        });

        return {
            updatedRequest,
            transaction,
        };
    }

    // Used by operator to verify borrow request before transfer the payment
    async verifyBorrowRequest(reqId: number) {
        const { request, creditLine } = await this.getRequestAndCreditLine(reqId, ActionTypes.BORROW);
        if (!(request instanceof BorrowRequest)) {
            throw new Error("Incorrect request received");
        }
        const collateralToken = await this.currencyService.getCollateralCurrency(
            creditLine.collateralCurrencyId
        );

        const requestedBorrowAmount = await this.getBorrowAmount(
            request,
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawCollateralAmount
        );

        try {
            await this.riskEngineService.verifyBorrowOrThrow(
                creditLine,
                collateralToken.symbol,
                creditLine.collateralCurrency.decimals,
                requestedBorrowAmount
            );
        } catch (e) {
            if (!(e instanceof Error)) {
                throw e;
            }
            return {
                isVerified: false,
                reason: e.message,
            };
        }

        return {
            isVerified: true,
        };
    }

    // Used to verify user requested borrow amount during the creation of new borrow request
    async verifyHypBorrowRequest(creditLineId: number, hypotheticalBorrowAmount: bigint) {
        const creditLineExtended = await this.creditLineService.getCreditLinesByIdCurrencyExtended(
            creditLineId
        );

        await this.riskEngineService.verifyBorrowOrThrow(
            creditLineExtended,
            creditLineExtended.collateralCurrency.symbol,
            creditLineExtended.collateralCurrency.decimals,
            hypotheticalBorrowAmount
        );
    }

    // Used by operator to resolve pending repay request after user's payment has been received.
    async resolveRepayRequest(resolveRepayRequestDto: ResolveFiatBasedRequestDto) {
        // Accrue interest
        // FIXME: add risk engine call

        const { request, creditLine } = await this.getRequestAndCreditLine(
            resolveRepayRequestDto.requestId,
            ActionTypes.REPAY
        );

        // Decrease debt amount for borrow request
        await this.creditLineService.decreaseDebtAmountById(
            creditLine,
            BigInt(resolveRepayRequestDto.rawTransferAmount)
        );

        // Update status for borrow req
        const updatedRequest = await this.requestHandlerService.updateRepayReqStatus(
            request.id,
            RepayRequestStatus.FINISHED
        );

        // Create new FiatTransaction
        const transaction = await this.transactionService.createFiatTransaction({
            ...resolveRepayRequestDto,
            borrowRequestId: request.id,
            repayRequestId: null,
            rawTransferAmount: BigInt(resolveRepayRequestDto.rawTransferAmount),
        });

        return {
            updatedRequest,
            transaction,
        };
    }

    // FIXME: If there is no any Deposit/Withdraw requests, but we received a callback, store it somehow
    // TODO: Add transaction mechanism ( increaseSupplyAmountById, update<X>ReqStatus, createCryptoTransaction )
    // Used by payment processing module to resolve pending crypto based request
    async resolveCryptoRequest(resolveDto: ResolveCryptoBasedRequestDto) {
        // Accrue interest
        // FIXME: add risk engine call

        const creditLine = await this.creditLineService.getCreditLineByChatIdAndColSymbol(
            Number(resolveDto.chatId),
            resolveDto.collateralSymbol
        );

        if (!creditLine) {
            throw new Error("Credit line not found");
        }

        const collateralCurrency = creditLine.collateralCurrency;
        const economicalParams = creditLine.economicalParameters;

        this.verifyTransferAmount(resolveDto.rawTransferAmount, collateralCurrency.decimals);

        let depositRequestId;
        let withdrawRequestId;
        if (resolveDto.callbackType === CallbackTypes.DEPOSIT) {
            ({ depositRequestId, withdrawRequestId } = await this.resolveDepositRequest(
                creditLine,
                collateralCurrency,
                economicalParams.cryptoProcessingFee,
                resolveDto.rawTransferAmount
            ));
        } else if (resolveDto.callbackType === CallbackTypes.WITHDRAWAL) {
            ({ depositRequestId, withdrawRequestId } = await this.resolveWithdrawRequest(
                creditLine,
                collateralCurrency,
                economicalParams.cryptoProcessingFee,
                resolveDto.rawTransferAmount
            ));
        } else {
            throw new HttpException("Incorrect callback type", HttpStatus.BAD_REQUEST);
        }

        // Create new CryptoTransaction
        await this.transactionService.createCryptoTransaction({
            depositRequestId,
            withdrawRequestId,
            rawTransferAmount: parseUnits(resolveDto.rawTransferAmount, collateralCurrency.decimals),
            // FIXME: maybe calculate usd amount by us?
            usdTransferAmount: parseUnits(resolveDto.usdTransferAmount),
            txHash: resolveDto.txHash,
            paymentProcessingTxId: resolveDto.paymentProcessingTxId,
        });
    }

    // // // Internal fns

    // Calculated borrow amount based on borrow request type.
    // For initial borrow request, borrow amount being calculated based on selected risk strategy and fresh collateral amount
    private async getBorrowAmount(
        request: BorrowRequest,
        collateralSymbol: string,
        collateralDecimals: number,
        rawSupplyAmount: bigint
    ) {
        let requestedBorrowAmount: bigint;

        if (!request.borrowFiatAmount && request.initialRiskStrategy) {
            requestedBorrowAmount = await this.riskEngineService.calculateInitialBorrowAmount(
                collateralSymbol,
                collateralDecimals,
                rawSupplyAmount,
                request.initialRiskStrategy
            );
        } else if (!request.initialRiskStrategy && request.borrowFiatAmount) {
            requestedBorrowAmount = request.borrowFiatAmount;
        } else {
            throw new Error("ResolveBorrowRequest: incorrect borrow request");
        }

        return requestedBorrowAmount;
    }

    // Returns Request && CreditLine entities according to ActionType && requestId
    private async getRequestAndCreditLine(reqId: number, actionType: ActionTypes) {
        const getReqFn = this.getRequestFnByAction(actionType);

        const request = (await getReqFn(reqId)) as
            | DepositRequest
            | WithdrawRequest
            | BorrowRequest
            | RepayRequest;
        const creditLine = await this.creditLineService.getCreditLinesByIdCurrencyExtended(
            request.creditLineId
        );

        return {
            request,
            creditLine,
        };
    }

    private getRequestFnByAction(action: ActionTypes) {
        switch (action) {
            case ActionTypes.DEPOSIT:
                return this.requestHandlerService.getDepositRequest;
            case ActionTypes.WITHDRAW:
                return this.requestHandlerService.getWithdrawRequest;
            case ActionTypes.BORROW:
                return this.requestHandlerService.getBorrowRequest;
            case ActionTypes.REPAY:
                return this.requestHandlerService.getRepayRequest;
            default:
                throw new Error("Unexpected action type");
        }
    }

    // Resolves a deposit request by updating the request status
    // and increasing the supply amount for the associated credit line.
    private async resolveDepositRequest(
        creditLine: CreditLine,
        collateralToken: CollateralCurrency,
        cryptoProcessingFeeRate: bigint,
        rawTransferAmount: string
    ) {
        // FIXME: VERIFY IF REQUEST IS INITIAL AND UPDATE BORROW REQUEST IN THAT CASE
        const pendingRequest = await this.requestHandlerService.getOldestPendingDepositReq(
            creditLine.id
        );
        if (!pendingRequest) {
            throw new Error("Pending deposit request not found");
        }

        const updatedRequest = await this.requestHandlerService.updateDepositReqStatus(
            pendingRequest,
            DepositRequestStatus.FINISHED
        );

        const convRawTransferAmount = parseUnits(rawTransferAmount, collateralToken.decimals);
        const newSupplyAmount = creditLine.rawCollateralAmount + convRawTransferAmount;

        // FIXME: merge 2 creditLine based db requests to one
        // Increase supply amount for credit line
        await this.creditLineService.updateSupplyAmountById(creditLine.id, newSupplyAmount);

        const processingFeeCryptoAmount = (convRawTransferAmount * cryptoProcessingFeeRate) / EXP_SCALE;
        const processingFeeFiatAmount = await this.priceOracleService.convertCryptoToUsd(
            collateralToken.symbol,
            collateralToken.decimals,
            processingFeeCryptoAmount
        );
        // Increase the debt position and fee accumulated by the amount of processing fee
        const newDebtAmount = creditLine.debtAmount + processingFeeFiatAmount;
        const newFeeAccumulatedAmount = creditLine.feeAccumulatedFiatAmount + processingFeeFiatAmount;
        await this.creditLineService.updateDebtAmountAndFeeAccumulatedById(
            creditLine.id,
            newDebtAmount,
            newFeeAccumulatedAmount
        );

        return {
            depositRequestId: updatedRequest.id,
            withdrawRequestId: null,
        };
    }

    // Resolves a withdrawal request by verifying the withdrawal amount, updating the request status,
    // and decreasing the supply amount for the associated credit line.
    private async resolveWithdrawRequest(
        creditLine: CreditLine,
        collateralToken: CollateralCurrency,
        cryptoProcessingFeeRate: bigint,
        rawTransferAmount: string
    ) {
        const pendingRequest = await this.requestHandlerService.getOldestPendingWithdrawReq(
            creditLine.id
        );

        if (!pendingRequest) {
            throw new Error("Pending withdraw request not found");
        }

        // FIXME: do we need somehow handle exception and save failed callbacks ?
        this.verifyWithdrawAmount(pendingRequest, collateralToken, rawTransferAmount);

        // Decrease supply amount for credit line
        const convRawTransferAmount = parseUnits(rawTransferAmount, collateralToken.decimals);
        const newSupplyAmount = creditLine.rawCollateralAmount - convRawTransferAmount;

        if (newSupplyAmount < 0) {
            // FIXME: do we need somehow handle it and save failed callbacks ?
            // Throw 500 in that case
            throw new Error("Deposit amount after withdraw can not be negative");
        }

        await this.requestHandlerService.updateWithdrawReqStatus(
            pendingRequest.id,
            WithdrawRequestStatus.FINISHED
        );

        await this.creditLineService.updateSupplyAmountById(creditLine.id, newSupplyAmount);

        // Apply processing fee for all cases, except the case when user withdraw all his collateral
        if (newSupplyAmount !== 0n) {
            const processingFeeCryptoAmount =
                (convRawTransferAmount * cryptoProcessingFeeRate) / EXP_SCALE;
            const processingFeeFiatAmount = await this.priceOracleService.convertCryptoToUsd(
                collateralToken.symbol,
                collateralToken.decimals,
                processingFeeCryptoAmount
            );
            // Increase the debt position by the amount of processing fee
            const newDebtAmount = creditLine.debtAmount + processingFeeFiatAmount;
            const newFeeAccumulatedAmount =
                creditLine.feeAccumulatedFiatAmount + processingFeeFiatAmount;
            await this.creditLineService.updateDebtAmountAndFeeAccumulatedById(
                creditLine.id,
                newDebtAmount,
                newFeeAccumulatedAmount
            );
        }

        return {
            depositRequestId: null,
            withdrawRequestId: pendingRequest.id,
        };
    }

    // Verifies if the actual withdraw amount matches the expected withdrawal amount specified in the withdrawal request.
    private verifyWithdrawAmount(
        request: WithdrawRequest,
        collateralToken: CollateralCurrency,
        rawTransferAmount: string
    ) {
        const actualWithdrawAmount = parseUnits(rawTransferAmount, collateralToken.decimals);

        if (!(request.withdrawAmount === actualWithdrawAmount)) {
            throw new HttpException("Incorrect withdraw amount received", HttpStatus.BAD_REQUEST);
        }
    }

    private verifyTransferAmount(rawTransferAmount: string, decimals: number) {
        const parts = rawTransferAmount.split(".");

        // rawTransferAmount is not in the correct structure: (missing decimal point)
        if (parts.length !== 2) {
            throw new HttpException(
                "Incorrect structure of rawTransferAmount received",
                HttpStatus.BAD_REQUEST
            );
        }

        const [wholePart, fractionalPart] = parts;

        // The whole or fractional is missing or empty
        if (!wholePart || !fractionalPart) {
            throw new HttpException(
                "The whole part of rawTransferAmount cannot be negative or zero",
                HttpStatus.BAD_REQUEST
            );
        }

        // Both the whole and fractional parts are zero
        if (
            (Number(wholePart) === 0 || /^\s*0+$/.test(wholePart)) &&
            (Number(fractionalPart) === 0 || /^\s*0+$/.test(fractionalPart))
        ) {
            throw new HttpException(
                "Both whole and fractional parts of rawTransferAmount cannot be zero",
                HttpStatus.BAD_REQUEST
            );
        }

        // The whole part or fractional part is not a number
        if (isNaN(Number(wholePart)) || isNaN(Number(fractionalPart))) {
            throw new HttpException(
                "Incorrect structure of rawTransferAmount received",
                HttpStatus.BAD_REQUEST
            );
        }

        // The whole part is negative
        if (Number(wholePart) < 0) {
            throw new HttpException(
                "The whole part of rawTransferAmount cannot be negative or zero",
                HttpStatus.BAD_REQUEST
            );
        }

        // The length of the fractional part exceeds decimals
        if (!fractionalPart || fractionalPart.length > decimals) {
            throw new HttpException("Fractional component exceeds decimals", HttpStatus.BAD_REQUEST);
        }
    }
}
