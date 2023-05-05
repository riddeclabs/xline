import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { TelegrafModule } from "nestjs-telegraf";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UserSession } from "../../common/middlewares/session.middleware";
import { entities } from "../../database";
import { NewCreditRequestWizard } from "./scenes/new-credit-request.scene";
import { ViewActiveCreditLineWizard } from "./scenes/view-active-line.scene";
import { MainScene } from "./scenes/main.scene";
import { RepayActionWizard } from "./scenes/repay.scene";
import { WithdrawActionWizard } from "./scenes/withdraw.scene";
import { ViewRequestWizard } from "./scenes/view-request.scene";
import { BotCommonService } from "./bot-common.service";

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
    ],
    providers: [
        BotService,
        MainScene,
        NewCreditRequestWizard,
        ViewActiveCreditLineWizard,
        RepayActionWizard,
        WithdrawActionWizard,
        ViewRequestWizard,
        BotCommonService,
    ],
})
export class BotModule {}
