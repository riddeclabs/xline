import { Injectable } from "@nestjs/common";
import { ResolveCryptoBasedRequestDto, ResolveFiatBasedRequestDto } from "./dto/resolve-request.dto";
import { RequestHandlerService } from "../request-handler/request-handler.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { RiskEngineService } from "../risk-engine/risk-engine.service";
import {
    ActionTypes,
    BorrowRequestStatus,
    DepositRequestStatus,
    RepayRequestStatus,
    WithdrawRequestStatus,
} from "../../common/enums/request.enum";
import { TransactionService } from "../transaction/transaction.service";
import { CurrencyService } from "../currency/currency.service";
import { BorrowRequest, DepositRequest, RepayRequest, WithdrawRequest } from "../../database/entities";

@Injectable()
export class RequestResolverService {
    constructor(
        private requestHandlerService: RequestHandlerService,
        private creditLineService: CreditLineService,
        private riskEngineService: RiskEngineService,
        private transactionService: TransactionService,
        private currencyService: CurrencyService
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

        const collateralToken = await this.currencyService.getCollateralCurrency(
            creditLine.collateralCurrencyId
        );

        const requestedBorrowAmount = await this.getBorrowAmount(
            request,
            collateralToken.symbol,
            creditLine.rawCollateralAmount
        );

        // Verify borrow request
        await this.riskEngineService.verifyBorrowOrThrow(
            creditLine,
            collateralToken.symbol,
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
            collateralToken.symbol,
            creditLine.rawCollateralAmount
        );

        try {
            await this.riskEngineService.verifyBorrowOrThrow(
                creditLine,
                collateralToken.symbol,
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
        const creditLine = await this.creditLineService.getCreditLineById(creditLineId);
        const collateralToken = await this.currencyService.getCollateralCurrency(
            creditLine.collateralCurrencyId
        );

        await this.riskEngineService.verifyBorrowOrThrow(
            creditLine,
            collateralToken.symbol,
            hypotheticalBorrowAmount
        );
    }

    // Used to verify user requested withdraw amount during the creation of new withdraw request
    async verifyHypWithdrawRequest(creditLineId: number, hypotheticalWithdrawAmount: bigint) {
        // TODO: add impl
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

    // Used by payment processing module to resolve pending deposit request after user's payment has been received
    async resolveDepositRequest(resolveDepositRequestDto: ResolveCryptoBasedRequestDto) {
        // Accrue interest
        // FIXME: add risk engine call

        const { request, creditLine } = await this.getRequestAndCreditLine(
            resolveDepositRequestDto.requestId,
            ActionTypes.DEPOSIT
        );

        // Increase supply amount for credit line
        await this.creditLineService.increaseSupplyAmountById(
            creditLine,
            BigInt(resolveDepositRequestDto.rawTransferAmount)
        );

        // Update status for borrow req
        const updatedRequest = await this.requestHandlerService.updateDepositReqStatus(
            request.id,
            DepositRequestStatus.FINISHED
        );

        // Create new FiatTransaction
        const transaction = await this.transactionService.createCryptoTransaction({
            ...resolveDepositRequestDto,
            depositRequestId: request.id,
            withdrawRequestId: null,
            rawTransferAmount: BigInt(resolveDepositRequestDto.rawTransferAmount),
            usdTransferAmount: BigInt(resolveDepositRequestDto.usdTransferAmount),
        });

        return {
            updatedRequest,
            transaction,
        };
    }

    // Used by payment processing module to resolve pending withdraw request after user's payment has been received
    async resolveWithdrawRequest(resolveWithdrawRequestDto: ResolveCryptoBasedRequestDto) {
        // Accrue interest
        // FIXME: add risk engine call

        const { request, creditLine } = await this.getRequestAndCreditLine(
            resolveWithdrawRequestDto.requestId,
            ActionTypes.WITHDRAW
        );

        // Increase supply amount for credit line
        await this.creditLineService.decreaseSupplyAmountById(
            creditLine,
            BigInt(resolveWithdrawRequestDto.rawTransferAmount)
        );

        // Update status for borrow req
        const updatedRequest = await this.requestHandlerService.updateWithdrawReqStatus(
            request.id,
            WithdrawRequestStatus.FINISHED
        );

        // Create new FiatTransaction
        const transaction = await this.transactionService.createCryptoTransaction({
            ...resolveWithdrawRequestDto,
            depositRequestId: request.id,
            withdrawRequestId: null,
            rawTransferAmount: BigInt(resolveWithdrawRequestDto.rawTransferAmount),
            usdTransferAmount: BigInt(resolveWithdrawRequestDto.usdTransferAmount),
        });

        return {
            updatedRequest,
            transaction,
        };
    }

    // // // Internal fns

    // Calculated borrow amount based on borrow request type.
    // For initial borrow request, borrow amount being calculated based on selected risk strategy and fresh collateral amount
    private async getBorrowAmount(
        request: BorrowRequest,
        collateralSymbol: string,
        rawSupplyAmount: bigint
    ) {
        let requestedBorrowAmount: bigint;

        if (!request.borrowFiatAmount && request.initialRiskStartegy) {
            requestedBorrowAmount = await this.riskEngineService.calculateInitialBorrowAmount(
                collateralSymbol,
                rawSupplyAmount,
                request.initialRiskStartegy
            );
        } else if (!request.initialRiskStartegy && request.borrowFiatAmount) {
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
        const creditLine = await this.creditLineService.getCreditLineById(request.creditLineId);

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
}
