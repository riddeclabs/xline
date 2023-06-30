import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import {
    BorrowRequest,
    CreditLine,
    Operator,
    RepayRequest,
    User,
    DebtCurrency,
    CollateralCurrency,
} from "src/database/entities";

import { BackOfficeController } from "./backoffice.controller";
import { BackOfficeService } from "./backoffice.service";
import { PriceOracleModule } from "../price-oracle/price-oracle.module";
import { BotModule } from "../bot/bot.module";
import { RiskEngineModule } from "../risk-engine/risk-engine.module";

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([
            Operator,
            User,
            BorrowRequest,
            RepayRequest,
            CreditLine,
            CollateralCurrency,
            DebtCurrency,
        ]),
        BotModule,
        PriceOracleModule,
        RiskEngineModule,
    ],
    exports: [BackOfficeService],
    providers: [BackOfficeService],
    controllers: [BackOfficeController],
})
export class BackOfficeModule {}
