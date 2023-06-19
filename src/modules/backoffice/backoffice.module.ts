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
import { UserModule } from "../user/user.module";
import { CreditLineModule } from "../credit-line/credit-line.module";
import { PriceOracleModule } from "../price-oracle/price-oracle.module";
import { BotService } from "../bot/bot.service";
import { BotManagerService } from "../bot/bot-manager.service";
import { PaymentProcessingModule } from "../payment-processing/payment-processing.module";
import { CurrencyModule } from "../currency/currency.module";
import { PaymentRequisiteModule } from "../payment-requisite/payment-requisite.module";
import { RiskEngineModule } from "../risk-engine/risk-engine.module";
import { RequestHandlerModule } from "../request-handler/request-handler.module";
import { EconomicalParametersModule } from "../economical-parameters/economical-parameters.module";
import { RequestResolverModule } from "../request-resolver/request-resolver.module";

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
        UserModule,
        CreditLineModule,
        UserModule,
        PriceOracleModule,
        PaymentProcessingModule,
        CurrencyModule,
        PaymentRequisiteModule,
        RiskEngineModule,
        RequestHandlerModule,
        EconomicalParametersModule,
        RequestResolverModule,
    ],
    exports: [BackOfficeService],
    providers: [BackOfficeService, BotService, BotManagerService],
    controllers: [BackOfficeController],
})
export class BackOfficeModule {}
