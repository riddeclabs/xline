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
    FiatTransaction,
    CryptoTransaction,
    CollateralCurrency,
    DepositRequest,
    WithdrawRequest,
} from "src/database/entities";

import { BackOfficeController } from "./backoffice.controller";
import { BackOfficeService } from "./backoffice.service";
import { PriceOracleModule } from "../price-oracle/price-oracle.module";
import { BotModule } from "../bot/bot.module";
import { RiskEngineModule } from "../risk-engine/risk-engine.module";
import { RequestHandlerModule } from "../request-handler/request-handler.module";

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
            FiatTransaction,
            CryptoTransaction,
            DepositRequest,
            WithdrawRequest,
        ]),
        BotModule,
        PriceOracleModule,
        RiskEngineModule,
        RequestHandlerModule,
    ],
    exports: [BackOfficeService],
    providers: [BackOfficeService],
    controllers: [BackOfficeController],
})
export class BackOfficeModule {}
