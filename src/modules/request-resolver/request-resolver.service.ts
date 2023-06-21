import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import {
    ResolveBorrowRequestDto,
    ResolveCryptoBasedRequestDto,
    ResolveRepayRequestDto,
} from "./dto/resolve-request.dto";
import { RequestHandlerService } from "../request-handler/request-handler.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { RiskEngineService } from "../risk-engine/risk-engine.service";
import {
    ActionTypes,
    BorrowRequestStatus,
    DepositRequestStatus,
    FiatTransactionStatus,
    parseUnits,
    RepayRequestStatus,
    WithdrawRequestStatus,
} from "../../common";
import { TransactionService } from "../transaction/transaction.service";
import {
    BorrowRequest,
    CollateralCurrency,
    CreditLine,
    DepositRequest,
    RepayRequest,
    WithdrawRequest,
} from "../../database/entities";
import { CallbackTypes } from "../payment-processing/constants";
import { PaymentRequisiteService } from "../payment-requisite/payment-requisite.service";
import { validateIban, validateName } from "src/common/input-validation";

@Injectable()
export class RequestResolverService {
    constructor(
        private requestHandlerService: RequestHandlerService,
        private creditLineService: CreditLineService,
        private riskEngineService: RiskEngineService,
        private transactionService: TransactionService,
        private paymentRequisiteService: PaymentRequisiteService
    ) {}

    /**
     Used by operator to resolve borrow request. Resolves request by creating a fiat transaction and updating the request status.
     Should be used for "initial" request resolving. 
     To finalize resolving process use finalizeBorrowRequest or rejectBorrowRequest functions.
     @param {ResolveBorrowRequestDto} resolveBorrowRequest - The request to resolve
     @returns {Promise<Object>} - A promise that resolves to an object containing the updated request.
     @throws {HttpException} - If the request is not in the correct state or resolveBorrowRequest is incorrect.
     */
    async resolveBorrowRequest(
        resolveBorrowRequest: ResolveBorrowRequestDto
    ): Promise<{ success: boolean }> {
        // Accrue interest
        // FIXME: add risk engine call

        const borrowRequest = await this.requestHandlerService.getFullyAssociatedBorrowRequest(
            resolveBorrowRequest.requestId
        );
        const creditLine = borrowRequest.creditLine;

        const bRequisites = await this.paymentRequisiteService.getBusinessPayReqWithCurrencyByIban(
            resolveBorrowRequest.ibanFrom
        );

        if (!bRequisites) {
            throw new HttpException(
                "No business requisites found for this borrow request",
                HttpStatus.BAD_REQUEST
            );
        } else if (bRequisites.debtCurrency.symbol !== creditLine.debtCurrency.symbol) {
            throw new HttpException(
                "Business requisites currency does not match credit line currency",
                HttpStatus.BAD_REQUEST
            );
        }

        if (borrowRequest.borrowRequestStatus !== BorrowRequestStatus.VERIFICATION_PENDING) {
            throw new HttpException(
                "Resolving request requires VERIFICATION_PENDING status",
                HttpStatus.UNPROCESSABLE_ENTITY
            );
        }

        if (
            parseUnits(resolveBorrowRequest.rawTransferAmount, creditLine.debtCurrency.decimals) !==
            borrowRequest.borrowFiatAmount
        ) {
            throw new HttpException("Incorrect rawTransferAmount amount", HttpStatus.BAD_REQUEST);
        }

        const pendingTxs = borrowRequest.fiatTransactions.filter(
            tx => tx.status === FiatTransactionStatus.PENDING
        );

        if (pendingTxs.length !== 0) {
            throw new HttpException(
                "Resolving request has pending transactions",
                HttpStatus.BAD_REQUEST
            );
        }

        const borrowAmountWithFee = await this.riskEngineService.calculateBorrowAmountWithFees(
            creditLine.id,
            borrowRequest.borrowFiatAmount
        );

        try {
            await this.riskEngineService.verifyBorrowOverLFOrThrow(
                creditLine,
                creditLine.collateralCurrency.symbol,
                creditLine.collateralCurrency.decimals,
                borrowAmountWithFee
            );
        } catch (e) {
            throw new HttpException("Err", HttpStatus.BAD_REQUEST);
        }

        await this.transactionService.createFiatTransaction({
            borrowRequestId: borrowRequest.id,
            repayRequestId: null,
            ibanFrom: bRequisites.iban,
            ibanTo: creditLine.userPaymentRequisite.iban,
            nameFrom: bRequisites.bankName,
            nameTo: creditLine.user.name,
            rawTransferAmount: borrowRequest.borrowFiatAmount,
        });

        await this.requestHandlerService.updateBorrowReqStatus(
            borrowRequest.id,
            BorrowRequestStatus.MONEY_SENT
        );

        return {
            success: true,
        };
    }

    /**
     Used by operator to finalize borrow request when bank tx is finalized.
     @param {number} requestId - The ID of the request to finalize.
     @returns {Promise<Object>} - A promise that resolves to an object containing the updated request.
     @throws {HttpException} - If the request is not in the correct state
     */
    async finalizeBorrowRequest(requestId: number): Promise<{ success: boolean }> {
        // Accrue interest
        // FIXME: add risk engine call
        const borrowRequest = await this.requestHandlerService.getFullyAssociatedBorrowRequest(
            requestId
        );
        const creditLine = borrowRequest.creditLine;

        if (!borrowRequest.borrowFiatAmount) {
            throw new HttpException(
                "Borrow request has no borrowFiatAmount",
                HttpStatus.UNPROCESSABLE_ENTITY
            );
        }

        if (borrowRequest.borrowRequestStatus !== BorrowRequestStatus.MONEY_SENT) {
            throw new HttpException(
                "Resolving request requires MONEY_SENT status",
                HttpStatus.UNPROCESSABLE_ENTITY
            );
        }

        const pendingTxs = borrowRequest.fiatTransactions.filter(
            tx => tx.status === FiatTransactionStatus.PENDING
        );

        if (pendingTxs.length === 0) {
            throw new HttpException(
                "Resolving request requires pending transaction",
                HttpStatus.UNPROCESSABLE_ENTITY
            );
        } else if (pendingTxs.length > 1) {
            throw new HttpException(
                "Resolving request has mode that one pending transaction",
                HttpStatus.UNPROCESSABLE_ENTITY
            );
        }

        // Update tx status
        const pendingTx = pendingTxs[0]!;
        await this.transactionService.updateFiatTransactionStatus(
            pendingTx,
            FiatTransactionStatus.COMPLETED
        );

        await this.requestHandlerService.updateBorrowReqStatus(
            borrowRequest.id,
            BorrowRequestStatus.FINISHED
        );

        const feeAmount = await this.riskEngineService.calculateBorrowAmountWithFees(
            creditLine.id,
            borrowRequest.borrowFiatAmount
        );

        // Increase debt amount for borrow request on borrow value
        await this.creditLineService.increaseDebtAmountById(
            creditLine.id,
            borrowRequest.borrowFiatAmount + feeAmount
        );

        // Increase debt amount for borrow request on fee value
        await this.creditLineService.increaseAccumulatedFeeAmountById(creditLine.id, feeAmount);

        return {
            success: true,
        };
    }

    /**
     Used by operator to reject borrow request.
     @param {number} requestId - The ID of the request to reject.
     @returns {Promise<Object>} - A promise that resolves to an object containing the updated request.
     @throws {HttpException} - If the request is not in the correct state
     */
    async rejectBorrowRequest(requestId: number): Promise<{ success: boolean }> {
        const borrowRequest = await this.requestHandlerService.getFullyAssociatedBorrowRequest(
            requestId
        );

        const pendingTxs = borrowRequest.fiatTransactions.filter(
            tx => tx.status === FiatTransactionStatus.PENDING
        );

        // Update tx status if tx exists
        if (pendingTxs.length > 0) {
            if (pendingTxs.length > 1) {
                throw new HttpException(
                    "Rejecting request has mode that one pending transaction",
                    HttpStatus.UNPROCESSABLE_ENTITY
                );
            }

            const pendingTx = pendingTxs[0]!;
            await this.transactionService.updateFiatTransactionStatus(
                pendingTx,
                FiatTransactionStatus.REJECTED
            );
        }

        // Update status for borrow request
        await this.requestHandlerService.updateBorrowReqStatus(
            borrowRequest.id,
            BorrowRequestStatus.REJECTED
        );

        return {
            success: true,
        };
    }

    // Used by operator to verify borrow request before transfer the payment
    async verifyBorrowRequest(reqId: number) {
        const borrowRequest = await this.requestHandlerService.getFullyAssociatedBorrowRequest(reqId);

        if (borrowRequest.borrowRequestStatus === BorrowRequestStatus.REJECTED) {
            throw new HttpException(
                "Borrow request could not be verified: request status is REJECTED",
                HttpStatus.BAD_REQUEST
            );
        }

        const creditLine = borrowRequest.creditLine;

        const requestedBorrowAmount = await this.getBorrowAmount(
            borrowRequest,
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawCollateralAmount
        );

        const amountWithFee = await this.riskEngineService.calculateBorrowAmountWithFees(
            creditLine.id,
            requestedBorrowAmount
        );

        try {
            await this.riskEngineService.verifyBorrowOverCFOrThrow(
                creditLine,
                creditLine.collateralCurrency.symbol,
                creditLine.collateralCurrency.decimals,
                amountWithFee
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

        const borrowAmountWithFee = await this.riskEngineService.calculateBorrowAmountWithFees(
            creditLineId,
            hypotheticalBorrowAmount
        );

        await this.riskEngineService.verifyBorrowOverCFOrThrow(
            creditLineExtended,
            creditLineExtended.collateralCurrency.symbol,
            creditLineExtended.collateralCurrency.decimals,
            borrowAmountWithFee
        );
    }

    // Used to verify user requested withdraw amount during the creation of new withdraw request
    async verifyHypWithdrawRequest(creditLineId: number, hypotheticalWithdrawAmount: bigint) {
        // TODO: add impl
    }

    /**
     Used by operator to resolve pending repay request after user's payment has been received.
     @param {ResolveRepayRequestDto} resolveRepayRequestDto - The data object containing the information needed to resolve the repay request.
     @returns {Promise<Object>} - A promise that resolves to an object containing the updated credit line, updated request, and transaction details.
     @throws {HttpException} - Throws an exception if the repay request status is not VERIFICATION_PENDING or if the repay amount exceeds the user's current debt.
     */
    async resolveRepayRequest(resolveRepayRequestDto: ResolveRepayRequestDto) {
        // Accrue interest
        // FIXME: add risk engine call

        const repayRequest = await this.requestHandlerService.getFullyAssociatedRepayRequest(
            resolveRepayRequestDto.requestId
        );
        const creditLine = repayRequest.creditLine;
        const debtCurrency = creditLine.debtCurrency;

        // Validate block
        if (repayRequest.repayRequestStatus !== RepayRequestStatus.VERIFICATION_PENDING) {
            throw new HttpException(
                "Resolving request requires VERIFICATION_PENDING status",
                HttpStatus.UNPROCESSABLE_ENTITY
            );
        }
        this.verifyTransferAmount(resolveRepayRequestDto.rawTransferAmount, debtCurrency.decimals, true);
        if (!validateIban(resolveRepayRequestDto.ibanFrom).valid) {
            throw new HttpException("Invalid IBAN was received", HttpStatus.BAD_REQUEST);
        }
        if (!validateName(resolveRepayRequestDto.nameFrom)) {
            throw new HttpException("Invalid bank account name was received", HttpStatus.BAD_REQUEST);
        }

        const transferAmount = parseUnits(
            resolveRepayRequestDto.rawTransferAmount,
            debtCurrency.decimals
        );

        // TODO: Add more convenient solution how to handle this case
        if (creditLine.debtAmount < transferAmount) {
            throw new HttpException(
                "The repay amount exceeds the user's current debt",
                HttpStatus.CONFLICT
            );
        }

        // Decrease debt amount for repay request
        const updatedCreditLine = await this.creditLineService.decreaseDebtAmountById(
            creditLine.id,
            transferAmount
        );

        // Update status for repay request
        const updatedRequest = await this.requestHandlerService.updateRepayReqStatus(
            repayRequest.id,
            RepayRequestStatus.FINISHED
        );

        // Create new FiatTransaction
        const transaction = await this.transactionService.createFiatTransaction({
            ibanFrom: resolveRepayRequestDto.ibanFrom.replace(/\s/g, "").toLocaleUpperCase(),
            nameFrom: resolveRepayRequestDto.nameFrom.toUpperCase(),
            ibanTo: repayRequest.businessPaymentRequisite.iban,
            nameTo: repayRequest.businessPaymentRequisite.bankName,
            borrowRequestId: null,
            repayRequestId: repayRequest.id,
            rawTransferAmount: transferAmount,
        });

        return {
            updatedCreditLine,
            updatedRequest,
            transaction,
        };
    }

    /**
     Used by operator to reject repay request.
     @param {number} requestId - The ID of the request to reject.
     @returns {Promise<Object>} - A promise that resolves to an object containing the updated request.
     */
    async rejectRepayRequest(requestId: number) {
        const repayRequest = await this.requestHandlerService.getFullyAssociatedRepayRequest(requestId);

        // Update status for repay request
        const updatedRequest = await this.requestHandlerService.updateRepayReqStatus(
            repayRequest.id,
            RepayRequestStatus.REJECTED
        );

        return {
            updatedRequest,
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

        this.verifyTransferAmount(resolveDto.rawTransferAmount, collateralCurrency.decimals);

        let depositRequestId;
        let withdrawRequestId;
        if (resolveDto.callbackType === CallbackTypes.DEPOSIT) {
            ({ depositRequestId, withdrawRequestId } = await this.resolveDepositRequest(
                creditLine,
                collateralCurrency,
                resolveDto.rawTransferAmount
            ));
        } else if (resolveDto.callbackType === CallbackTypes.WITHDRAWAL) {
            ({ depositRequestId, withdrawRequestId } = await this.resolveWithdrawRequest(
                creditLine,
                collateralCurrency,
                resolveDto.rawTransferAmount
            ));
        } else {
            throw new Error("Incorrect callback type");
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
                return this.requestHandlerService.getDepositRequest.bind(this.requestHandlerService);
            case ActionTypes.WITHDRAW:
                return this.requestHandlerService.getWithdrawRequest.bind(this.requestHandlerService);
            case ActionTypes.BORROW:
                return this.requestHandlerService.getFullyAssociatedBorrowRequest.bind(
                    this.requestHandlerService
                );
            case ActionTypes.REPAY:
                return this.requestHandlerService.getFullyAssociatedRepayRequest.bind(
                    this.requestHandlerService
                );
            default:
                throw new Error("Unexpected action type");
        }
    }

    // Resolves a deposit request by updating the request status
    // and increasing the supply amount for the associated credit line.
    private async resolveDepositRequest(
        creditLine: CreditLine,
        collateralCurrency: CollateralCurrency,
        rawTransferAmount: string
    ) {
        const pendingRequest = await this.requestHandlerService.getOldestPendingDepositReq(
            creditLine.id
        );
        if (!pendingRequest) {
            throw new Error("Pending deposit request not found");
        }

        const updatedRequest = await this.requestHandlerService.updateDepositReqStatus(
            pendingRequest.id,
            DepositRequestStatus.FINISHED
        );

        // Increase supply amount for credit line
        await this.creditLineService.increaseSupplyAmountById(
            creditLine.id,
            parseUnits(rawTransferAmount, collateralCurrency.decimals)
        );

        return {
            updatedRequest,
            depositRequestId: updatedRequest.id,
            withdrawRequestId: null,
        };
    }

    // Resolves a withdrawal request by verifying the withdrawal amount, updating the request status,
    // and decreasing the supply amount for the associated credit line.
    private async resolveWithdrawRequest(
        creditLine: CreditLine,
        collateralCurrency: CollateralCurrency,
        rawTransferAmount: string
    ) {
        const pendingRequest = await this.requestHandlerService.getOldestPendingWithdrawReq(
            creditLine.id
        );

        this.verifyWithdrawAmount(pendingRequest, collateralCurrency, rawTransferAmount);

        const updatedRequest = await this.requestHandlerService.updateWithdrawReqStatus(
            pendingRequest.id,
            WithdrawRequestStatus.FINISHED
        );

        // Decrease supply amount for credit line
        await this.creditLineService.decreaseSupplyAmountById(
            creditLine.id,
            parseUnits(rawTransferAmount, collateralCurrency.decimals)
        );

        return {
            updatedRequest,
            depositRequestId: null,
            withdrawRequestId: updatedRequest.id,
        };
    }

    // Verifies if the actual withdraw amount matches the expected withdrawal amount specified in the withdrawal request.
    private verifyWithdrawAmount(
        request: WithdrawRequest,
        collateralCurrency: CollateralCurrency,
        rawTransferAmount: string
    ) {
        const actualWithdrawAmount = parseUnits(rawTransferAmount, collateralCurrency.decimals);

        if (!(request.withdrawAmount === actualWithdrawAmount)) {
            throw new Error("Incorrect withdraw amount received");
        }
    }

    private verifyTransferAmount(rawTransferAmount: string, decimals: number, isIntegerAllowed = false) {
        const parts = rawTransferAmount.split(".");

        if (isIntegerAllowed && parts.length == 1) {
            if (Number(rawTransferAmount) <= 0) {
                throw new HttpException(
                    "The whole part of rawTransferAmount cannot be negative or zero",
                    HttpStatus.BAD_REQUEST
                );
            }
            return;
        }

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
