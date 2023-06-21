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
import { BorrowRequestStatus, createUserGatewayId, generateReferenceNumber, xor } from "../../common";
import { parseUnits } from "../../common";
import { RequestResolverService } from "../request-resolver/request-resolver.service";
import { SignApplicationSceneData } from "./scenes/new-credit-request/new-credit-request.types";
import { BorrowRequest, CreditLine, EconomicalParameters } from "src/database/entities";
import { EXP_SCALE } from "../../common/constants";
import { CreditLineDetails } from "../credit-line/credit-line.types";

export type CreditLineDetailsExt = {
    economicalParams: EconomicalParameters;
    lineDetails: CreditLineDetails;
};

@Injectable()
export class BotManagerService {
    constructor(
        readonly paymentProcessingService: PaymentProcessingService,
        readonly currencyService: CurrencyService,
        readonly priceOracleService: PriceOracleService,
        readonly paymentRequisiteService: PaymentRequisiteService,
        readonly riskEngineService: RiskEngineService,
        readonly requestHandlerService: RequestHandlerService,
        readonly economicalParamsService: EconomicalParametersService,
        readonly userService: UserService,
        readonly creditLineService: CreditLineService,
        readonly requestResolverService: RequestResolverService
    ) {}

    // Scene handlers

    async finishNewCreditLine(
        chatId: number,
        debtCurrencyId: number,
        economicalParamsId: number,
        collateralCurrencyId: number,
        riskStrategy: bigint,
        userIban?: string,
        userName?: string
    ) {
        let user = await this.userService.getUserByChatId(chatId);
        let userPaymentRequisite = await this.paymentRequisiteService.getUserPaymentRequisiteByChatId(
            chatId
        );

        // If only one of database values are defined, something went wrong
        if (xor(user, userPaymentRequisite)) {
            throw new Error("Existing data is inconsistent");
            // If both database values are undefined, we must have full user data set to create a new one
        } else if (!user && !userPaymentRequisite) {
            if (!userName || !userIban) throw new Error("Insufficient data to create user");

            user = await this.userService.createUser({ chatId, name: userName });
            // save user IBAN
            userPaymentRequisite = await this.paymentRequisiteService.saveNewUserRequisite({
                userId: user.id,
                debtCurrencyId,
                iban: userIban,
            });
        } // else both are defined, do nothing

        // sanity check to make TS happy
        if (!user || !userPaymentRequisite) {
            throw new Error("Both User and UserPaymentRequisite entities must exits");
        }

        // generate new ref number
        const refNumber = generateReferenceNumber();

        // save new credit line
        const newCreditLine: CreateCreditLineDto = {
            userPaymentRequisiteId: userPaymentRequisite.id,
            userId: user.id,
            economicalParametersId: economicalParamsId,
            debtCurrencyId,
            collateralCurrencyId,
            gatewayUserId: createUserGatewayId(user.chatId, collateralCurrencyId),
            isLiquidated: false,
            refNumber,
        };
        const creditLine = await this.creditLineService.saveNewCreditLine(newCreditLine);

        // save deposit request
        await this.saveNewDepositRequest(creditLine.id);

        // save borrow request
        await this.requestHandlerService.saveNewBorrowRequest({
            creditLineId: creditLine.id,
            borrowFiatAmount: null,
            initialRiskStrategy: riskStrategy,
            borrowRequestStatus: BorrowRequestStatus.WAITING_FOR_DEPOSIT,
        });
    }

    async getNewCreditDetails(sceneData: SignApplicationSceneData) {
        const economicalParameters = await this.getFreshEconomicalParams(
            sceneData.colToken.id,
            sceneData.debtToken.id
        );

        const openCreditLineData = await this.riskEngineService.calculateOpenCreditLineData(
            sceneData.colToken.symbol,
            sceneData.colToken.decimals,
            parseUnits(sceneData.supplyAmount, sceneData.colToken.decimals),
            parseUnits(sceneData.riskStrategy),
            economicalParameters
        );

        return {
            economicalParameters,
            openCreditLineData,
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

    // User

    async getUserByChatId(chatId: number) {
        return this.userService.getUserByChatId(chatId);
    }

    // Economical params

    async getFreshEconomicalParams(collateralCurrencyId: number, debtCurrencyId: number) {
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

    async getUserPaymentRequisiteByChatId(paymentReqId: number) {
        return this.paymentRequisiteService.getUserPaymentRequisiteByChatId(paymentReqId);
    }

    // Credit line

    async getCreditLineDetails(creditLineId: number): Promise<CreditLineDetailsExt> {
        const lineEconomicalParams = await this.economicalParamsService.getEconomicalParamsByLineId(
            creditLineId
        );
        const creditLine = await this.creditLineService.getCreditLinesByIdAllSettingsExtended(
            creditLineId
        );

        const depositUsdAmount = await this.priceOracleService.convertCryptoToUsd(
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawCollateralAmount
        );

        const getUtilRate = () => (depositUsdAmount * EXP_SCALE) / creditLine.debtAmount;

        return {
            economicalParams: lineEconomicalParams,
            lineDetails: {
                ...creditLine,
                utilizationRate: creditLine.debtAmount === 0n ? 0n : getUtilRate(),
                fiatCollateralAmount: depositUsdAmount,
            },
        };
    }

    async getCreditLineByChatIdAndColSymbol(
        chatId: number,
        colSymbol: string
    ): Promise<CreditLine | null> {
        return await this.creditLineService.getCreditLineByChatIdAndColSymbol(chatId, colSymbol);
    }

    // Requests

    async saveNewDepositRequest(creditLineId: number) {
        return await this.requestHandlerService.saveNewDepositRequest({ creditLineId });
    }

    async saveNewWithdrawRequest(
        creditLineId: number,
        walletToWithdraw: string,
        withdrawAmount: bigint
    ) {
        await this.verifyHypWithdrawRequest(creditLineId, withdrawAmount);
        await this.requestHandlerService.saveNewWithdrawRequest({
            creditLineId,
            walletToWithdraw,
            withdrawAmount,
        });
    }

    async saveNewBorrowRequest(creditLineId: number, borrowFiatAmount: bigint) {
        await this.verifyHypBorrowRequest(creditLineId, borrowFiatAmount);
        await this.requestHandlerService.saveNewBorrowRequest({
            creditLineId,
            borrowFiatAmount,
            initialRiskStrategy: null,
            borrowRequestStatus: BorrowRequestStatus.VERIFICATION_PENDING,
        });
    }

    async calculateBorrowAmountWithFee(creditLineId: number, borrowFiatAmount: bigint) {
        return this.riskEngineService.calculateBorrowAmountWithFees(creditLineId, borrowFiatAmount);
    }

    async verifyHypBorrowRequest(creditLineId: number, borrowFiatAmount: bigint) {
        await this.requestResolverService.verifyHypBorrowRequest(creditLineId, borrowFiatAmount);
    }

    async verifyHypWithdrawRequest(creditLineId: number, withdrawAmount: bigint) {
        await this.requestResolverService.verifyHypWithdrawRequest(creditLineId, withdrawAmount);
    }

    async saveNewRepayRequest(creditLineId: number, businessPaymentRequisiteId: number) {
        return await this.requestHandlerService.saveNewRepayRequest({
            creditLineId,
            businessPaymentRequisiteId,
        });
    }

    async getCollateralTokenBySymbol(tokenSymbol: string) {
        return await this.currencyService.getCollateralTokenBySymbol(tokenSymbol);
    }

    async getDebtTokenBySymbol(tokenSymbol: string) {
        return await this.currencyService.getDebtTokenBySymbol(tokenSymbol);
    }

    async getUserCreditLinesCurrencyExtended(chatId: number) {
        return this.creditLineService.getCreditLinesByChatIdCurrencyExtended(chatId);
    }

    async getOldestPendingBorrowReq(creditLineId: number): Promise<BorrowRequest | null> {
        return this.requestHandlerService.getOldestPendingBorrowReq(creditLineId);
    }

    async getOldestUnfinalizedBorrowReq(creditLineId: number): Promise<BorrowRequest | null> {
        return this.requestHandlerService.getOldestUnfinalizedBorrowReq(creditLineId);
    }

    async getOldestPendingDepositReq(creditLineId: number) {
        return this.requestHandlerService.getOldestPendingDepositReq(creditLineId);
    }

    async getOldestPendingRepayReq(creditLineId: number) {
        return this.requestHandlerService.getOldestPendingRepayReq(creditLineId);
    }

    async getFreshBusinessPayReqByDebtSymbol(debtSymbol: string) {
        return this.paymentRequisiteService.getFreshBusinessPayReqByDebtSymbol(debtSymbol);
    }

    async getBusinessPayReqByRequestId(repayRequestId: number) {
        return this.paymentRequisiteService.getBusinessPayReqByRequestId(repayRequestId);
    }

    async getCreditLineById(creditLineId: number) {
        return this.creditLineService.getCreditLineById(creditLineId);
    }
    async getCreditLinesByIdAllSettingsExtended(creditLineId: number) {
        return this.creditLineService.getCreditLinesByIdAllSettingsExtended(creditLineId);
    }
}
