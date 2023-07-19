import { Injectable } from "@nestjs/common";
import { EconomicalParametersService } from "../economical-parameters/economical-parameters.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { CreditLine, EconomicalParameters } from "../../database/entities";
import { PriceOracleService } from "../price-oracle/price-oracle.service";
import { EXP_SCALE, HOURS_IN_YEAR } from "../../common/constants";
import { CryptoFee, OpenCreditLineData } from "./risk-engine.types";
import { parseUnits } from "../../common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class RiskEngineService {
    constructor(
        private economicalParamsService: EconomicalParametersService,
        private creditLineService: CreditLineService,
        private priceOracleService: PriceOracleService
    ) {}

    // scaledRawDepositAmount - token Amount must be scaled by 1e18 to get correct USD value
    async calculateOpenCreditLineData(
        collateralTokenSymbol: string,
        collateralTokenDecimals: number,
        scaledRawDepositAmount: bigint,
        riskStrategy: bigint,
        economicalParams: EconomicalParameters
    ): Promise<OpenCreditLineData> {
        const depositUsd = await this.priceOracleService.convertCryptoToUsd(
            collateralTokenSymbol,
            collateralTokenDecimals,
            scaledRawDepositAmount
        );
        const borrowUsd = (depositUsd * riskStrategy) / EXP_SCALE;
        const collateralAmount = (depositUsd * economicalParams.collateralFactor) / EXP_SCALE;

        const currentPrice = await this.priceOracleService.getTokenPriceBySymbol(collateralTokenSymbol);

        const additionalDecimals = 18 - collateralTokenDecimals;

        const collateralLimitPrice =
            (borrowUsd * EXP_SCALE) / (scaledRawDepositAmount * 10n ** BigInt(additionalDecimals));

        const depositProcFeeUsd = (
            await this.calculateCryptoProcessingFeeAmount(economicalParams, scaledRawDepositAmount)
        ).feeFiat;
        const borrowProcFeeUsd = this.calculateFiatProcessingFeeAmount(economicalParams, borrowUsd);

        return {
            expDepositAmountUsd: depositUsd,
            expBorrowAmountUsd: borrowUsd,
            expCollateralAmountUsd: collateralAmount,
            collateralLimitPrice,
            currentPrice: parseUnits(currentPrice),
            depositProcFeeUsd,
            borrowProcFeeUsd,
            totalProcFeeUsd: depositProcFeeUsd + borrowProcFeeUsd,
        };
    }

    async calculateInitialBorrowAmount(
        collateralTokenSymbol: string,
        collateralTokenDecimals: number,
        scaledRawDepositAmount: bigint,
        riskStrategyRate: bigint
    ) {
        const depositUsd = await this.priceOracleService.convertCryptoToUsd(
            collateralTokenSymbol,
            collateralTokenDecimals,
            scaledRawDepositAmount
        );
        return (depositUsd * riskStrategyRate) / EXP_SCALE;
    }

    calculateFiatProcessingFeeAmount(
        economicalParameters: EconomicalParameters,
        amount: bigint
    ): bigint {
        return (
            economicalParameters.minFiatProcessingFee +
            (amount * economicalParameters.fiatProcessingFee) / EXP_SCALE
        );
    }

    async calculateCryptoProcessingFeeAmount(
        economicalParameters: EconomicalParameters,
        amount: bigint
    ): Promise<CryptoFee> {
        const minFeeFiat = economicalParameters.minCryptoProcessingFeeFiat;

        // TODO: in case we need to support not only USD needs to be refactored
        const minFeeCrypto = await this.priceOracleService.convertUsdToCrypto(
            economicalParameters.collateralCurrency.symbol,
            economicalParameters.collateralCurrency.decimals,
            minFeeFiat
        );

        const feeCrypto = (amount * economicalParameters.cryptoProcessingFee) / EXP_SCALE;

        // TODO: in case we need to support not only USD needs to be refactored
        const cryptoFeeUsd = await this.priceOracleService.convertCryptoToUsd(
            economicalParameters.collateralCurrency.symbol,
            economicalParameters.collateralCurrency.decimals,
            feeCrypto
        );

        return {
            feeCrypto: minFeeCrypto + feeCrypto,
            feeFiat: minFeeFiat + cryptoFeeUsd,
        };
    }

    calculateBorrowAmountWithFees(
        economicalParameters: EconomicalParameters,
        borrowAmount: bigint
    ): bigint {
        const fee = this.calculateFiatProcessingFeeAmount(economicalParameters, borrowAmount);
        return borrowAmount + fee;
    }

    // Verify if borrow is possible over collateral factor
    // Utilization after borrow must be less or equal than collateral factor
    async verifyBorrowOverCFOrThrow(
        creditLine: CreditLine,
        collateralSymbol: string,
        collateralDecimals: number,
        borrowAmount: bigint
    ) {
        if (
            !(await this.isBorrowPossibleCollateralFactor(
                creditLine,
                collateralSymbol,
                collateralDecimals,
                borrowAmount
            ))
        ) {
            throw new Error("Insufficient liquidity to process borrow");
        }
    }

    // Verify if borrow is possible over liquidation factor
    // Utilization after borrow must be less or equal than liquidation factor
    // In that case utilization after borrow could be greater than collateral factor
    async verifyBorrowOverLFOrThrow(
        creditLine: CreditLine,
        collateralSymbol: string,
        collateralDecimals: number,
        borrowAmount: bigint
    ) {
        if (
            !(await this.isBorrowPossibleLiquidationFactor(
                creditLine,
                collateralSymbol,
                collateralDecimals,
                borrowAmount
            ))
        ) {
            throw new Error("Insufficient liquidity to process borrow");
        }
    }

    async isBorrowPossibleCollateralFactor(
        creditLine: CreditLine,
        collateralSymbol: string,
        collateralDecimals: number,
        borrowAmount: bigint
    ): Promise<boolean> {
        const economicalParams = await this.economicalParamsService.getParamsById(
            creditLine.economicalParametersId
        );
        return this.isBorrowPossible(
            creditLine,
            collateralSymbol,
            collateralDecimals,
            borrowAmount,
            economicalParams.collateralFactor
        );
    }

    async isBorrowPossibleLiquidationFactor(
        creditLine: CreditLine,
        collateralSymbol: string,
        collateralDecimals: number,
        borrowAmount: bigint
    ): Promise<boolean> {
        const economicalParams = await this.economicalParamsService.getParamsById(
            creditLine.economicalParametersId
        );
        return this.isBorrowPossible(
            creditLine,
            collateralSymbol,
            collateralDecimals,
            borrowAmount,
            economicalParams.liquidationFactor
        );
    }

    async isBorrowPossible(
        creditLine: CreditLine,
        collateralSymbol: string,
        collateralDecimals: number,
        borrowAmount: bigint,
        collateralOrLiquidationFactor: bigint
    ): Promise<boolean> {
        const collateralAmount =
            (creditLine.rawDepositAmount * collateralOrLiquidationFactor) / EXP_SCALE;

        const usdCollateralAmount = await this.priceOracleService.convertCryptoToUsd(
            collateralSymbol,
            collateralDecimals,
            collateralAmount
        );

        const hypotheticalUsdBorrowAmount = creditLine.debtAmount + borrowAmount;
        return hypotheticalUsdBorrowAmount <= usdCollateralAmount;
    }

    /**
     @description
     Calculates the utilization rate based on the provided deposit and debt amounts.
     If the deposit amount is zero or falsy, the utilization rate is considered to be zero.
     The utilization rate is returned as a bigint value.
     @param {bigint} depositFiatAmount - The amount of fiat currency deposited.
     @param {bigint} debtFiatAmount - The amount of fiat currency borrowed as debt.
     @returns {bigint} - The utilization rate as a bigint representing a decimal value.
     */
    calculateUtilizationRate(depositFiatAmount: bigint, debtFiatAmount: bigint) {
        if (!depositFiatAmount) return 0n;
        return (debtFiatAmount * EXP_SCALE) / depositFiatAmount;
    }

    // Every day at 1 AM
    @Cron("0 1 * * *")
    async accrueInterestCron() {
        const allCreditLines = await this.creditLineService.getAllActiveCreditLinesAllSettingsExtended();

        if (!allCreditLines) {
            return;
        }

        for (const creditLine of allCreditLines) {
            await this.accrueInterest(creditLine);
        }
    }

    async accrueInterest(creditLine: CreditLine): Promise<CreditLine> {
        const now = new Date();
        const timeDelta = (now.getTime() - creditLine.accruedAt.getTime()) / (1000 * 3600);
        const hoursSinceAccrual = Math.floor(timeDelta);

        if (hoursSinceAccrual <= 0) {
            return creditLine;
        }

        const interestAccrued = this.calculateInterestAccrued(creditLine, hoursSinceAccrual);
        return await this.creditLineService.accrueInterestById(creditLine.id, interestAccrued, now);
    }

    calculateInterestAccrued(creditLine: CreditLine, hours: number): bigint {
        const apr = creditLine.economicalParameters.apr;
        const ratePerHour = apr / HOURS_IN_YEAR;
        return (creditLine.debtAmount * ratePerHour * parseUnits(hours)) / EXP_SCALE / EXP_SCALE;
    }

    async getMaxAllowedBorrowAmount(
        creditLine: CreditLine,
        externalScaledPrice?: bigint
    ): Promise<bigint> {
        const fiatDepositAmount = await this.priceOracleService.convertCryptoToUsd(
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawDepositAmount,
            externalScaledPrice
        );

        const fiatCollateralAmount =
            (fiatDepositAmount * creditLine.economicalParameters.collateralFactor) / EXP_SCALE;
        const freeLiquidityFiatAmount = fiatCollateralAmount - creditLine.debtAmount;
        const processingFee = this.calculateFiatProcessingFeeAmount(
            creditLine.economicalParameters,
            freeLiquidityFiatAmount
        );

        return freeLiquidityFiatAmount - processingFee;
    }

    async calculateMaxAllowedToWithdraw(
        creditLine: CreditLine,
        scaledTokenPrice?: bigint
    ): Promise<bigint> {
        // In case debt amount is zero, we do not apply processing fee and allow to withdraw entire deposit amount
        if (creditLine.debtAmount === 0n) {
            return creditLine.rawDepositAmount;
        }

        // Calculate the diff between max amount tha user can borrow and actual debt amount
        const depositFiatAmount = await this.priceOracleService.convertCryptoToUsd(
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawDepositAmount,
            scaledTokenPrice
        );

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

        const processingFeeCrypto = await this.calculateCryptoProcessingFeeAmount(
            creditLine.economicalParameters,
            freeLiquidityCrypto
        );

        return freeLiquidityCrypto > processingFeeCrypto.feeCrypto
            ? freeLiquidityCrypto - processingFeeCrypto.feeCrypto
            : 0n;
    }
}
