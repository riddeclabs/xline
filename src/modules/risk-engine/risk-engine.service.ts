import { Injectable } from "@nestjs/common";
import { EconomicalParametersService } from "../economical-parameters/economical-parameters.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { CreditLine, EconomicalParameters } from "../../database/entities";
import { PriceOracleService } from "../price-oracle/price-oracle.service";
import { EXP_SCALE } from "../../common/constants";
import { OpenCreditLineData } from "./risk-engine.types";
import { parseUnits } from "../../common/fixed-number";

@Injectable()
export class RiskEngineService {
    constructor(
        private economicalParamsService: EconomicalParametersService,
        private creditLineService: CreditLineService,
        private priceOracleService: PriceOracleService
    ) {}

    async calculateOpenCreditLineData(
        collateralTokenSymbol: string,
        scaledRawSupplyAmount: bigint,
        riskStrategy: bigint,
        economicalParams: EconomicalParameters
    ): Promise<OpenCreditLineData> {
        const supplyProcFee = economicalParams.fiatProcessingFee;
        const borrowProcFee = economicalParams.cryptoProcessingFee;

        const userPortfolio = await this.calculateUserPortfolio(
            collateralTokenSymbol,
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
        scaledRawSupplyAmount: bigint,
        collateralFactor: bigint,
        riskStrategyRate: bigint
    ) {
        const supplyUsd = await this.priceOracleService.convertCryptoToUsd(
            collateralTokenSymbol,
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
        scaledRawSupplyAmount: bigint,
        riskStrategyRate: bigint
    ) {
        const supplyUsd = await this.priceOracleService.convertCryptoToUsd(
            collateralTokenSymbol,
            scaledRawSupplyAmount
        );
        return (supplyUsd * riskStrategyRate) / EXP_SCALE;
    }

    async verifyBorrowOrThrow(creditLine: CreditLine, collateralSymbol: string, borrowAmount: bigint) {
        const economicalParams = await this.economicalParamsService.getParamsById(
            creditLine.economicalParametersId
        );

        const collateralAmount =
            (creditLine.rawCollateralAmount * economicalParams.collateralFactor) / EXP_SCALE;

        const usdCollateralAmount = await this.priceOracleService.convertCryptoToUsd(
            collateralSymbol,
            collateralAmount
        );

        const hypotheticalUsdBorrowAmount = creditLine.debtAmount + borrowAmount;

        if (hypotheticalUsdBorrowAmount > usdCollateralAmount) {
            throw new Error("Insufficient liquidity to process borrow");
        }
    }
}
