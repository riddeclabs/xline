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
import {
    CollateralCurrency,
    BorrowRequest,
    CreditLine,
    DepositRequest,
    DebtCurrency,
    RepayRequest,
    WithdrawRequest,
} from "src/database/entities";
import { EXP_SCALE, maxUint256 } from "../../common/constants";
import { SceneRequestTypes } from "./scenes/view-requests/view-request.types";
import { XLineRequestsTypes } from "./scenes/common/types";

export interface WithdrawRequestDetails {
    currentState: {
        utilizationRate: bigint;
        rawDepositAmount: bigint;
        debtAmount: bigint;
    };
    newState: { utilizationRate: bigint; rawDepositAmount: bigint; debtAmount: bigint };
    currencies: {
        collateralCurrency: CollateralCurrency;
        debtCurrency: DebtCurrency;
    };
    processingFeeFiatAmount: bigint;
    processingFeeCryptoAmount: bigint;
    collateralFactor: bigint;
}

export type CreditLineExtras = {
    fiatSupplyAmount: bigint;
    fiatCollateralAmount: bigint;
    utilizationRate: bigint;
    maxAllowedCryptoToWithdraw: bigint;
    maxAllowedBorrowAmount: bigint;
};

export type CreditLineWithExtras = CreditLine & CreditLineExtras;

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

    async getUtilizationRate(creditLine: CreditLine, externalScaledPrice?: bigint): Promise<bigint> {
        const scaledTokenPrice =
            externalScaledPrice ??
            (await this.priceOracleService.getScaledTokenPriceBySymbol(
                creditLine.collateralCurrency.symbol
            ));

        const fiatSupplyAmount = await this.priceOracleService.convertCryptoToUsd(
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawCollateralAmount,
            scaledTokenPrice
        );

        return this.riskEngineService.calculateUtilizationRate(fiatSupplyAmount, creditLine.debtAmount);
    }

    async getCreditLineExtras(
        creditLine: CreditLine,
        externalScaledTokenPrice?: bigint
    ): Promise<CreditLineExtras> {
        const scaledTokenPrice =
            externalScaledTokenPrice ??
            (await this.priceOracleService.getScaledTokenPriceBySymbol(
                creditLine.collateralCurrency.symbol
            ));
        const fiatSupplyAmount = await this.priceOracleService.convertCryptoToUsd(
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawCollateralAmount,
            scaledTokenPrice
        );

        const fiatCollateralAmount =
            (fiatSupplyAmount * creditLine.economicalParameters.collateralFactor) / EXP_SCALE;

        const utilizationRate = this.riskEngineService.calculateUtilizationRate(
            fiatSupplyAmount,
            creditLine.debtAmount
        );

        const maxAllowedCryptoToWithdraw = await this.calculateMaxAllowedToWithdraw(
            creditLine,
            fiatSupplyAmount,
            scaledTokenPrice
        );

        const maxAllowedBorrowAmount = await this.getMaxAllowedBorrowAmount(
            creditLine,
            scaledTokenPrice
        );

        return {
            fiatSupplyAmount,
            fiatCollateralAmount,
            utilizationRate,
            maxAllowedCryptoToWithdraw,
            maxAllowedBorrowAmount,
        };
    }

    async getMaxAllowedBorrowAmount(CreditLine: CreditLine, scaledTokenPrice?: bigint) {
        return await this.riskEngineService.getMaxAllowedBorrowAmount(CreditLine, scaledTokenPrice);
    }

    async calculateWithdrawRequestDetails(
        creditLineId: number,
        withdrawAmount: bigint
    ): Promise<WithdrawRequestDetails> {
        const creditLine = await this.accrueInterestAndGetCLAllSettingsExtended(creditLineId);
        const scaledTokenPrice = await this.priceOracleService.getScaledTokenPriceBySymbol(
            creditLine.collateralCurrency.symbol
        );
        const creditLineExtras = await this.getCreditLineExtras(creditLine, scaledTokenPrice);

        const collateralCurrency = creditLine.collateralCurrency;
        const currentState = {
            rawDepositAmount: creditLine.rawCollateralAmount,
            debtAmount: creditLine.debtAmount,
            utilizationRate: creditLineExtras.utilizationRate,
        };

        const actualWithdrawAmount =
            withdrawAmount === maxUint256 ? creditLineExtras.maxAllowedCryptoToWithdraw : withdrawAmount;

        const newDepositAmountRaw = creditLine.rawCollateralAmount - actualWithdrawAmount;
        const newDepositAmountFiat = await this.priceOracleService.convertCryptoToUsd(
            collateralCurrency.symbol,
            collateralCurrency.decimals,
            newDepositAmountRaw,
            scaledTokenPrice
        );

        let processingFeeCryptoAmount: bigint;
        let processingFeeFiatAmount: bigint;

        if (withdrawAmount === maxUint256) {
            processingFeeCryptoAmount = 0n;
            processingFeeFiatAmount = 0n;
        } else {
            processingFeeCryptoAmount = await this.riskEngineService.calculateCryptoProcessingFeeAmount(
                creditLine.id,
                actualWithdrawAmount
            );
            processingFeeFiatAmount = await this.priceOracleService.convertCryptoToUsd(
                collateralCurrency.symbol,
                collateralCurrency.decimals,
                processingFeeCryptoAmount,
                scaledTokenPrice
            );
        }

        const newDebtAmount = creditLine.debtAmount + processingFeeFiatAmount;

        const newUtilizationRate = this.riskEngineService.calculateUtilizationRate(
            newDepositAmountFiat,
            newDebtAmount
        );

        const newState = {
            rawDepositAmount: newDepositAmountRaw,
            debtAmount: newDebtAmount,
            utilizationRate: newUtilizationRate,
        };

        return {
            currentState,
            newState,
            processingFeeCryptoAmount,
            processingFeeFiatAmount,
            collateralFactor: creditLine.economicalParameters.collateralFactor,
            currencies: {
                collateralCurrency: creditLine.collateralCurrency,
                debtCurrency: creditLine.debtCurrency,
            },
        };
    }

    async calculateMaxAllowedToWithdraw(
        creditLine: CreditLine,
        depositFiatAmount: bigint,
        scaledTokenPrice?: bigint
    ) {
        // In case debt amount is zero, we do not apply processing fee and allow to withdraw entire deposit amount
        if (creditLine.debtAmount === 0n) {
            return creditLine.rawCollateralAmount;
        }

        // Calculate the diff between max amount tha user can borrow and actual debt amount
        const maxAllowedDebtAmount =
            (depositFiatAmount * creditLine.economicalParameters.collateralFactor) / EXP_SCALE;
        const freeLiquidityFiat = maxAllowedDebtAmount - creditLine.debtAmount;

        if (freeLiquidityFiat <= 0) {
            return 0n;
        }

        const freeLiquidityCrypto = await this.priceOracleService.convertUsdToCrypto(
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            freeLiquidityFiat,
            scaledTokenPrice
        );

        // FIXME: add a separate fn to calculate a processing fee (with fixed/minimal fee support functionality)
        //        and return ZERO in case (freeLiquidityCrypto - processingFeeCrypto) < 0
        // Calculate processing fee based on entire free liquidity amount
        const processingFeeCrypto =
            (freeLiquidityCrypto * creditLine.economicalParameters.cryptoProcessingFee) / EXP_SCALE;
        return freeLiquidityCrypto - processingFeeCrypto;
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
        return await this.requestHandlerService.saveNewWithdrawRequest({
            creditLineId,
            walletToWithdraw,
            withdrawAmount,
        });
    }

    // Used to verify user requested withdraw amount during the creation of new withdraw request
    async verifyHypWithdrawRequestOrThrow(
        maxAllowedCryptoToWithdraw: bigint,
        withdrawAmount: bigint
    ): Promise<void> {
        if (withdrawAmount > maxAllowedCryptoToWithdraw) {
            throw new Error("Insufficient liquidity to withdraw");
        }
    }

    async saveNewBorrowRequest(creditLine: CreditLine, borrowFiatAmount: bigint) {
        await this.verifyHypBorrowRequest(creditLine, borrowFiatAmount);
        await this.requestHandlerService.saveNewBorrowRequest({
            creditLineId: creditLine.id,
            borrowFiatAmount,
            initialRiskStrategy: null,
            borrowRequestStatus: BorrowRequestStatus.VERIFICATION_PENDING,
        });
    }

    async calculateBorrowAmountWithFeeAndFee(
        creditLineId: number,
        borrowFiatAmount: bigint
    ): Promise<[bigint, bigint]> {
        const amountWithFee = await this.riskEngineService.calculateBorrowAmountWithFees(
            creditLineId,
            borrowFiatAmount
        );
        const fee = await this.riskEngineService.calculateFiatProcessingFeeAmount(
            creditLineId,
            borrowFiatAmount
        );
        return [amountWithFee, fee];
    }

    async verifyHypBorrowRequest(creditLine: CreditLine, borrowFiatAmount: bigint) {
        await this.requestResolverService.verifyHypBorrowRequest(creditLine, borrowFiatAmount);
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

    async accrueInterestAndGetCLAllSettingsExtended(creditLineId: number) {
        const cl = await this.creditLineService.getCreditLinesByIdAllSettingsExtended(creditLineId);
        return this.riskEngineService.accrueInterest(cl);
    }

    async getAllFullyAssociatedReqByTypeAndCLId(
        requestType: SceneRequestTypes,
        creditLineId: number
    ): Promise<XLineRequestsTypes[] | null> {
        switch (requestType) {
            case SceneRequestTypes.DEPOSIT:
                return await this.requestHandlerService.getAllFullyAssociatedDepositReqByLineId(
                    creditLineId
                );
            case SceneRequestTypes.WITHDRAW:
                return await this.requestHandlerService.getAllFullyAssociatedWithdrawReqByLineId(
                    creditLineId
                );
            case SceneRequestTypes.BORROW:
                return await this.requestHandlerService.getAllFullyAssociatedBorrowReqByLineId(
                    creditLineId
                );
            case SceneRequestTypes.REPAY:
                return await this.requestHandlerService.getAllFullyAssociatedRepayReqByLineId(
                    creditLineId
                );
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _: never = requestType;
                throw new Error(`Request type ${requestType} is not supported`);
        }
    }

    async getLatestRequestByType(
        requestType: SceneRequestTypes,
        creditLineId: number
    ): Promise<XLineRequestsTypes | null> {
        let request: XLineRequestsTypes | null = null;
        switch (requestType) {
            case SceneRequestTypes.DEPOSIT:
                request = await this.getLatestFullyAssociatedDepositReq(creditLineId);
                break;
            case SceneRequestTypes.WITHDRAW:
                request = await this.getLatestFullyAssociatedWithdrawReq(creditLineId);
                break;
            case SceneRequestTypes.BORROW:
                request = await this.getLatestFullyAssociatedBorrowReq(creditLineId);
                break;
            case SceneRequestTypes.REPAY:
                request = await this.getLatestFullyAssociatedRepayReq(creditLineId);
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const _: never = requestType;
                throw new Error(`Request type ${requestType} is not supported`);
        }
        return request;
    }

    async getLatestFullyAssociatedDepositReq(creditLineId: number): Promise<DepositRequest | null> {
        const req = await this.requestHandlerService.getNewestDepositReq(creditLineId);
        if (!req) return null;
        return await this.requestHandlerService.getFullyAssociatedDepositRequest(req.id);
    }

    async getLatestFullyAssociatedWithdrawReq(creditLineId: number): Promise<WithdrawRequest | null> {
        const req = await this.requestHandlerService.getNewestWithdrawReq(creditLineId);
        if (!req) return null;
        return await this.requestHandlerService.getFullyAssociatedWithdrawRequest(req.id);
    }

    async getLatestFullyAssociatedBorrowReq(creditLineId: number): Promise<BorrowRequest | null> {
        const req = await this.requestHandlerService.getNewestBorrowReq(creditLineId);
        if (!req) return null;
        return await this.requestHandlerService.getFullyAssociatedBorrowRequest(req.id);
    }

    async getLatestFullyAssociatedRepayReq(creditLineId: number): Promise<RepayRequest | null> {
        const req = await this.requestHandlerService.getNewestRepayReq(creditLineId);
        if (!req) return null;
        return await this.requestHandlerService.getFullyAssociatedRepayRequest(req.id);
    }

    async getAllBorrowRequestsByCreditLineId(
        creditLineId: number
    ): Promise<[BorrowRequest[], number] | null> {
        return await this.requestHandlerService.getAllBorrowReqByLineId(creditLineId);
    }

    async getAllDepositRequestsByCreditLineId(
        creditLineId: number
    ): Promise<[DepositRequest[], number] | null> {
        return await this.requestHandlerService.getAllDepositReqByLineId(creditLineId);
    }

    async getAllWithdrawRequestsByCreditLineId(
        creditLineId: number
    ): Promise<[WithdrawRequest[], number] | null> {
        return await this.requestHandlerService.getAllWithdrawReqByLineId(creditLineId);
    }

    async getAllRepayRequestsByCreditLineId(
        creditLineId: number
    ): Promise<[RepayRequest[], number] | null> {
        return await this.requestHandlerService.getAllRepayReqByLineId(creditLineId);
    }
    async getOldestPendingWithdrawRequest(creditLineId: number) {
        return this.requestHandlerService.getOldestPendingWithdrawReq(creditLineId);
    }
}
