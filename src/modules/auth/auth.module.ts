import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { OperatorsModule } from "src/modules/operators/operators.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionSerializer } from "./serializers/session.serializer";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { JwtModuleOptions } from "@nestjs/jwt/dist/interfaces/jwt-module-options.interface";

@Module({
    imports: [
        OperatorsModule,
        ConfigModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                return {
                    secret: configService.get<string>("JWT_SECRET_KEY"),
                    signOptions: { expiresIn: "20s" },
                } as JwtModuleOptions;
            },
        }),
    ],
    exports: [AuthService],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, LocalStrategy, SessionSerializer],
})
export class AuthModule {}
