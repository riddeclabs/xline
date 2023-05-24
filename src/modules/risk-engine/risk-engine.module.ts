import { Module } from "@nestjs/common";
import { RiskEngineService } from "./risk-engine.service";
import { CreditLineModule } from "../credit-line/credit-line.module";
import { EconomicalParametersModule } from "../economical-parameters/economical-parameters.module";
import { PriceOracleModule } from "../price-oracle/price-oracle.module";

@Module({
    imports: [CreditLineModule, EconomicalParametersModule, PriceOracleModule],
    providers: [RiskEngineService],
    exports: [RiskEngineService],
})
export class RiskEngineModule {}
