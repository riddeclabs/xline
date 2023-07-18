import { Injectable } from "@nestjs/common";
import { EconomicalParametersService } from "../economical-parameters/economical-parameters.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { CreditLine, EconomicalParameters } from "../../database/entities";
import { PriceOracleService } from "../price-oracle/price-oracle.service";
import { EXP_SCALE, HOURS_IN_YEAR } from "../../common/constants";
import { OpenCreditLineData } from "./risk-engine.types";
import { parseUnits } from "../../common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class RiskEngineService {
    constructor(
        private economicalParamsService: EconomicalParametersService,
        private creditLineService: CreditLineService,
        private priceOracleService: PriceOracleService
    ) {}

    async calculateOpenCreditLineData(
        collateralTokenSymbol: string,
        collateralTokenDecimals: number,
        scaledRawSupplyAmount: bigint,
        riskStrategy: bigint,
        economicalParams: EconomicalParameters
    ): Promise<OpenCreditLineData> {
        const supplyProcFee = economicalParams.fiatProcessingFee;
        const borrowProcFee = economicalParams.cryptoProcessingFee;

        const userPortfolio = await this.calculateUserPortfolio(
            collateralTokenSymbol,
            collateralTokenDecimals,
            scaledRawSupplyAmount,
            economicalParams.collateralFactor,
            riskStrategy
        );
        const currentPrice = await this.priceOracleService.getTokenPriceBySymbol(collateralTokenSymbol);

        const additionalDecimals = 18 - collateralTokenDecimals;

        const collateralLimitPrice =
            (userPortfolio.borrowUsd * EXP_SCALE) /
            (scaledRawSupplyAmount * 10n ** BigInt(additionalDecimals));

        const supplyProcFeeUsd = (userPortfolio.supplyUsd * supplyProcFee) / EXP_SCALE;
        const borrowProcFeeUsd = (userPortfolio.borrowUsd * borrowProcFee) / EXP_SCALE;

        return {
            expSupplyAmountUsd: userPortfolio.supplyUsd,
            expBorrowAmountUsd: userPortfolio.borrowUsd,
            expCollateralAmountUsd: userPortfolio.collateralAmount,
            collateralLimitPrice,
            currentPrice: parseUnits(currentPrice),
            supplyProcFeeUsd,
            borrowProcFeeUsd,
            totalProcFeeUsd: supplyProcFeeUsd + borrowProcFee,
        };
    }

    // scaledRawSupplyAmount - token Amount must be scaled by 1e18 to get correct USD value
    private async calculateUserPortfolio(
        collateralTokenSymbol: string,
        collateralTokenDecimals: number,
        scaledRawSupplyAmount: bigint,
        collateralFactor: bigint,
        riskStrategyRate: bigint
    ) {
        const supplyUsd = await this.priceOracleService.convertCryptoToUsd(
            collateralTokenSymbol,
            collateralTokenDecimals,
            scaledRawSupplyAmount
        );
        const borrowUsd = (supplyUsd * riskStrategyRate) / EXP_SCALE;
        const collateralAmount = (supplyUsd * collateralFactor) / EXP_SCALE;

        return {
            supplyUsd,
            borrowUsd,
            // FIXME: add similar name collateralAmountUsd or change borrowAmountUsd
            collateralAmount,
        };
    }

    async calculateInitialBorrowAmount(
        collateralTokenSymbol: string,
        collateralTokenDecimals: number,
        scaledRawSupplyAmount: bigint,
        riskStrategyRate: bigint
    ) {
        const supplyUsd = await this.priceOracleService.convertCryptoToUsd(
            collateralTokenSymbol,
            collateralTokenDecimals,
            scaledRawSupplyAmount
        );
        return (supplyUsd * riskStrategyRate) / EXP_SCALE;
    }

    //TODO: Add minimum processing fee support
    async calculateFiatProcessingFeeAmount(creditLineId: number, amount: bigint): Promise<bigint> {
        const economicalParameters = await this.economicalParamsService.getEconomicalParamsByLineId(
            creditLineId
        );
        return (amount * economicalParameters.fiatProcessingFee) / EXP_SCALE;
    }

    //TODO: Add minimum processing fee support
    async calculateCryptoProcessingFeeAmount(creditLineId: number, amount: bigint): Promise<bigint> {
        const economicalParameters = await this.economicalParamsService.getEconomicalParamsByLineId(
            creditLineId
        );
        return (amount * economicalParameters.cryptoProcessingFee) / EXP_SCALE;
    }

    async calculateBorrowAmountWithFees(creditLineId: number, borrowAmount: bigint) {
        const fee = await this.calculateFiatProcessingFeeAmount(creditLineId, borrowAmount);
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
            (creditLine.rawCollateralAmount * collateralOrLiquidationFactor) / EXP_SCALE;

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
        const fiatSupplyAmount = await this.priceOracleService.convertCryptoToUsd(
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawCollateralAmount,
            externalScaledPrice
        );

        const fiatCollateralAmount =
            (fiatSupplyAmount * creditLine.economicalParameters.collateralFactor) / EXP_SCALE;
        const freeLiquidityFiatAmount = fiatCollateralAmount - creditLine.debtAmount;
        const processingFee = await this.calculateFiatProcessingFeeAmount(
            creditLine.id,
            freeLiquidityFiatAmount
        );

        return freeLiquidityFiatAmount - processingFee;
    }
}
