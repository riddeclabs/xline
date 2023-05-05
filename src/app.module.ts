import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BackOfficeModule } from "./modules/backoffice/backoffice.module";
import { AuthModule } from "./modules/auth/auth.module";
import { RouterModule } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { entities, migrations } from "./database";
import { BotModule } from "./modules/bot/bot.module";
import { TypeOrmModuleOptions } from "@nestjs/typeorm/dist/interfaces/typeorm-options.interface";

@Module({
    imports: [
        BotModule,
        AuthModule,
        BackOfficeModule,
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
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
