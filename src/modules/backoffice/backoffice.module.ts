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
    ],
    exports: [BackOfficeService],
    providers: [BackOfficeService],
    controllers: [BackOfficeController],
})
export class BackOfficeModule {}
