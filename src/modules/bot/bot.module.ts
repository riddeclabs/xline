import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { TelegrafModule } from "nestjs-telegraf";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UserSession } from "../../common/middlewares/session.middleware";
import { entities } from "../../database";
import { NewCreditRequestWizard } from "./scenes/new-credit-request/new-credit-request.scene";
import { ViewActiveCreditLineWizard } from "./scenes/view-active-line.scene";
import { MainScene } from "./scenes/main.scene";
import { RepayActionWizard } from "./scenes/repay.scene";
import { WithdrawActionWizard } from "./scenes/withdraw.scene";
import { ViewRequestWizard } from "./scenes/view-requests/view-request.scene";
import { BotCommonService } from "./bot-common.service";
import { BotManagerService } from "./bot-manager.service";
import { RiskEngineModule } from "../risk-engine/risk-engine.module";
import { PriceOracleModule } from "../price-oracle/price-oracle.module";
import { PaymentRequisiteModule } from "../payment-requisite/payment-requisite.module";
import { PaymentProcessingModule } from "../payment-processing/payment-processing.module";
import { CurrencyModule } from "../currency/currency.module";
import { RequestHandlerModule } from "../request-handler/request-handler.module";
import { EconomicalParametersModule } from "../economical-parameters/economical-parameters.module";
import { UserModule } from "../user/user.module";
import { CreditLineModule } from "../credit-line/credit-line.module";
import { RequestResolverModule } from "../request-resolver/request-resolver.module";
import { ManagePortfolioWizard } from "./scenes/manage-portfolio.scene";
import { NewCreditRequestText } from "./scenes/new-credit-request/new-credit-request.text";
import { ManageCreditLineWizard } from "./scenes/manage-credit-line/manage-credit-line.scene";
import { DepositActionWizard } from "./scenes/manage-credit-line/deposit/deposit.scene";

@Module({
    imports: [
        TelegrafModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                token: configService.get("TELEGRAM_BOT_TOKEN") as string,
                middlewares: [
                    new UserSession({
                        type: "postgres",
                        username: configService.get("DB_USERNAME") as string,
                        host: configService.get("DB_HOST") as string,
                        database: configService.get("DB_NAME") as string,
                        password: configService.get("DB_PASSWORD") as string,
                        port: Number(configService.get("DB_PORT")),
                        entities,
                    }).middleware(),
                ],
            }),
            inject: [ConfigService],
        }),
        CurrencyModule,
        PaymentProcessingModule,
        PaymentRequisiteModule,
        PriceOracleModule,
        RiskEngineModule,
        RequestHandlerModule,
        EconomicalParametersModule,
        UserModule,
        CreditLineModule,
        RequestResolverModule,
    ],
    providers: [
        BotService,
        BotManagerService,
        MainScene,
        NewCreditRequestWizard,
        ViewActiveCreditLineWizard,
        RepayActionWizard,
        WithdrawActionWizard,
        ViewRequestWizard,
        ManagePortfolioWizard,
        BotCommonService,
        NewCreditRequestText,
        ConfigService,
        ManageCreditLineWizard,
        DepositActionWizard,
    ],
})
export class BotModule {}
