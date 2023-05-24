import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BackOfficeModule } from "./modules/backoffice/backoffice.module";
import { AuthModule } from "./modules/auth/auth.module";
import { RouterModule } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { entities, migrations } from "./database";
import { BotModule } from "./modules/bot/bot.module";
import { TypeOrmModuleOptions } from "@nestjs/typeorm/dist/interfaces/typeorm-options.interface";
import { PaymentProcessingModule } from "./modules/payment-processing/payment-processing.module";
import { RequestResolverModule } from "./modules/request-resolver/request-resolver.module";
import { CurrencyModule } from "./modules/currency/currency.module";
import { PaymentRequisiteModule } from "./modules/payment-requisite/payment-requisite.module";
import { PriceOracleModule } from "./modules/price-oracle/price-oracle.module";
import { RiskEngineModule } from "./modules/risk-engine/risk-engine.module";
import { UserModule } from "./modules/user/user.module";
import { RequestHandlerModule } from "./modules/request-handler/request-handler.module";
import { CreditLineModule } from "./modules/credit-line/credit-line.module";
import { TransactionModule } from "./modules/transaction/transaction.module";
import { EconomicalParametersModule } from "./modules/economical-parameters/economical-parameters.module";

@Module({
    imports: [
        BotModule,
        AuthModule,
        BackOfficeModule,
        PaymentProcessingModule,
        RouterModule.register([
            {
                path: "/",
                module: BackOfficeModule,
            },
        ]),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            //FIXME: move to getConfig fn
            useFactory: (configService: ConfigService) =>
                ({
                    type: "postgres",
                    migrationsRun: process.env.NODE_ENV === "production",
                    host: configService.get("DB_HOST"),
                    port: configService.get("DB_PORT"),
                    username: configService.get("DB_USERNAME"),
                    password: configService.get("DB_PASSWORD"),
                    database: configService.get("DB_NAME"),
                    entities,
                    migrations,
                } as TypeOrmModuleOptions),
        }),
        RequestResolverModule,
        CurrencyModule,
        PaymentRequisiteModule,
        PriceOracleModule,
        RiskEngineModule,
        UserModule,
        RequestHandlerModule,
        CreditLineModule,
        TransactionModule,
        EconomicalParametersModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
