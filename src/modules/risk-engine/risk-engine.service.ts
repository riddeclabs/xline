import { Injectable } from "@nestjs/common";
import { EconomicalParametersService } from "../economical-parameters/economical-parameters.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { CreditLine, EconomicalParameters } from "../../database/entities";
import { PriceOracleService } from "../price-oracle/price-oracle.service";
import { EXP_SCALE } from "../../common/constants";
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
    ) {
        const liquidationFactor = economicalParams.liquidationFactor;
        const processingFee = economicalParams.fiatProcessingFee;

        const expectedBorrowAmountUsd = await this.calculateInitialBorrowAmount(
            collateralTokenSymbol,
            scaledRawSupplyAmount,
            riskStrategy
        );

        const currentPrice = await this.priceOracleService.getTokenPriceBySymbol(collateralTokenSymbol);

        const collateralLimitPrice =
            (((parseUnits(currentPrice) * EXP_SCALE) / liquidationFactor) * EXP_SCALE) /
            scaledRawSupplyAmount;

        const processingFeeUsd = (expectedBorrowAmountUsd * processingFee) / EXP_SCALE;

        return {
            expectedBorrowAmountUsd,
            collateralLimitPrice,
            processingFeeUsd,
        };
    }

    // scaledRawSupplyAmount - token Amount must be scaled by 1e18 to get correct USD value
    async calculateInitialBorrowAmount(
        collateralTokenSymbol: string,
        scaledRawSupplyAmount: bigint,
        riskStrategyRate: bigint
    ) {
        const supplyUtilizeShare = (scaledRawSupplyAmount * riskStrategyRate) / EXP_SCALE;
        return this.priceOracleService.convertCryptoToUsd(collateralTokenSymbol, supplyUtilizeShare);
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
