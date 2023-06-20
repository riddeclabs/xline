import { Injectable } from "@nestjs/common";
import { EconomicalParametersService } from "../economical-parameters/economical-parameters.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { CreditLine, EconomicalParameters } from "../../database/entities";
import { PriceOracleService } from "../price-oracle/price-oracle.service";
import { EXP_SCALE } from "../../common/constants";
import { OpenCreditLineData } from "./risk-engine.types";
import { parseUnits } from "../../common";

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

        const collateralLimitPrice = (userPortfolio.borrowUsd * EXP_SCALE) / scaledRawSupplyAmount;

        const supplyProcFeeUsd = (userPortfolio.supplyUsd * supplyProcFee) / EXP_SCALE;
        const borrowProcFeeUsd = (userPortfolio.borrowUsd * borrowProcFee) / EXP_SCALE;

        return {
            expSupplyAmountUsd: userPortfolio.supplyUsd,
            expBorrowAmountUsd: userPortfolio.borrowUsd,
            expCollateralAmountUsd: userPortfolio.borrowUsd,
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
}
