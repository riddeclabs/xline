import { Injectable } from "@nestjs/common";
import { PaymentProcessingService } from "../payment-processing/payment-processing.service";
import { CurrencyService } from "../currency/currency.service";
import { PriceOracleService } from "../price-oracle/price-oracle.service";
import { PaymentRequisiteService } from "../payment-requisite/payment-requisite.service";
import { RiskEngineService } from "../risk-engine/risk-engine.service";
import { RequestHandlerService } from "../request-handler/request-handler.service";
import { EconomicalParametersService } from "../economical-parameters/economical-parameters.service";
import { UserService } from "../user/user.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { CreateCreditLineDto } from "../credit-line/dto/create-credit-line.dto";
import { generateReferenceNumber } from "../../common";
import { formatUnits, parseUnits } from "../../common/fixed-number";
import { RequestResolverService } from "../request-resolver/request-resolver.service";
import { EconomicalParameters } from "../../database/entities";

@Injectable()
export class BotManagerService {
    constructor(
        readonly paymentProcessingService: PaymentProcessingService,
        readonly currencyService: CurrencyService,
        readonly priceOracleService: PriceOracleService,
        readonly paymentRequisiteService: PaymentRequisiteService,
        readonly riskEngineService: RiskEngineService,
        readonly requestHandler: RequestHandlerService,
        readonly economicalParamsService: EconomicalParametersService,
        readonly userService: UserService,
        readonly creditLineService: CreditLineService,
        readonly requestResolverService: RequestResolverService
    ) {}

    // Scene handlers

    async finishNewCreditLine(
        userId: number,
        debtCurrencyId: number,
        userIban: string,
        userName: string,
        economicalParamsId: number,
        collateralCurrencyId: number,
        riskStrategy: bigint
    ) {
        // TODO: handle case when user select already existed one
        // save user IBAN
        const userPaymentRequisite = await this.paymentRequisiteService.saveNewUserRequisite({
            userId,
            debtCurrencyId,
            iban: userIban,
        });

        // save user BANK ACCOUNT NAME
        await this.userService.updateUserName(userId, userName);

        // generate new ref number
        const refNumber = generateReferenceNumber();

        // save new credit line
        const newCreditLine: CreateCreditLineDto = {
            userPaymentRequisiteId: userPaymentRequisite.id,
            userId,
            economicalParametersId: economicalParamsId,
            debtCurrencyId,
            collateralCurrencyId,
            refNumber,
            isLiquidated: false,
        };
        const creditLine = await this.creditLineService.saveNewCreditLine(newCreditLine);

        // save deposit request
        await this.saveNewDepositRequest(creditLine.id);

        // save borrow request
        await this.requestHandler.saveNewBorrowRequest({
            creditLineId: creditLine.id,
            borrowFiatAmount: null,
            initRiskStrategy: riskStrategy,
        });
    }

    async getNewCreditDetails(
        collateralCurrencySymbol: string,
        collateralCurrencyId: number,
        debtCurrencyId: number,
        hypDepositAmount: string,
        riskStrategy: bigint
    ) {
        const economicalParameters = await this.getFreshEconomicalParams(
            collateralCurrencyId,
            debtCurrencyId
        );
        const loanData = await this.calculateOpenCreditLineData(
            collateralCurrencySymbol,
            hypDepositAmount,
            riskStrategy,
            economicalParameters
        );

        return {
            economicalParameters,
            loanData,
        };
    }

    // Supported tokens
    async getAllCollateralTokens() {
        return this.currencyService.getAllCollateralCurrency();
    }

    // Payment processing
    async getUserWallet(chatId: string, collateralCurrencySymbol: string) {
        return this.paymentProcessingService.getUserWallet(chatId, collateralCurrencySymbol);
    }

    // Risk engine

    private async calculateOpenCreditLineData(
        currencySymbol: string,
        hypDepositAmount: string,
        riskStrategy: bigint,
        economicalParams: EconomicalParameters
    ) {
        const scaledRawDepositAmount = parseUnits(hypDepositAmount);
        return this.riskEngineService.calculateOpenCreditLineData(
            currencySymbol,
            scaledRawDepositAmount,
            riskStrategy,
            economicalParams
        );
    }

    // Economical params

    private async getFreshEconomicalParams(collateralCurrencyId: number, debtCurrencyId: number) {
        return this.economicalParamsService.getFreshEconomicalParams(
            collateralCurrencyId,
            debtCurrencyId
        );
    }

    async getEconomicalParamsByLineId(creditLineId: number) {
        return this.economicalParamsService.getEconomicalParamsByLineId(creditLineId);
    }

    // Payment requisites

    async getBusinessPaymentRequisite(debtCurrencyId: number) {
        return this.paymentRequisiteService.getBusinessPayReqByCurrency(debtCurrencyId);
    }

    async getUserPaymentRequisite(paymentReqId: number) {
        return this.paymentRequisiteService.getUserPaymentRequisite(paymentReqId);
    }

    // Credit line

    async getCreditLineDetails(creditLineId: number) {
        const lineEconomicalParams = await this.economicalParamsService.getEconomicalParamsByLineId(
            creditLineId
        );
        const creditLine = await this.creditLineService.getCreditLineById(creditLineId);

        const collateralToken = await this.currencyService.getCollateralCurrency(
            creditLine.collateralCurrencyId
        );

        const depositUsdAmount = await this.priceOracleService.convertCryptoToUsd(
            collateralToken.symbol,
            creditLine.rawCollateralAmount
        );

        return {
            economicalParams: lineEconomicalParams,
            lineDetails: {
                utilRate: 1 / Number(formatUnits(creditLine.healthyFactor)),
                healthyFactor: formatUnits(creditLine.healthyFactor),
                totalFeeAccumulated: formatUnits(creditLine.feeAccumulatedFiatAmount),
                rawDepositAmount: formatUnits(creditLine.rawCollateralAmount, collateralToken.decimals),
                fiatDepositAmount: formatUnits(depositUsdAmount, collateralToken.decimals),
                isLiquidated: creditLine.isLiquidated,
            },
        };
    }

    // Requests

    async saveNewDepositRequest(creditLineId: number) {
        await this.requestHandler.saveNewDepositRequest({ creditLineId });
    }

    async saveNewWithdrawRequest(
        creditLineId: number,
        walletToWithdraw: string,
        withdrawAmount: bigint
    ) {
        await this.verifyHypWithdrawRequest(creditLineId, withdrawAmount);
        await this.requestHandler.saveNewWithdrawRequest({
            creditLineId,
            walletToWithdraw,
            withdrawAmount,
        });
    }

    async saveNewBorrowRequest(creditLineId: number, borrowFiatAmount: bigint) {
        await this.verifyHypBorrowRequest(creditLineId, borrowFiatAmount);
        await this.requestHandler.saveNewBorrowRequest({
            creditLineId,
            borrowFiatAmount,
            initRiskStrategy: null,
        });
    }

    async verifyHypBorrowRequest(creditLineId: number, borrowFiatAmount: bigint) {
        await this.requestResolverService.verifyHypBorrowRequest(creditLineId, borrowFiatAmount);
    }

    async verifyHypWithdrawRequest(creditLineId: number, withdrawAmount: bigint) {
        await this.requestResolverService.verifyHypWithdrawRequest(creditLineId, withdrawAmount);
    }

    async saveNewRepayRequest(creditLineId: number, paymentRequisiteId: number) {
        await this.requestHandler.saveNewRepayRequest({ creditLineId, paymentRequisiteId });
    }
}
