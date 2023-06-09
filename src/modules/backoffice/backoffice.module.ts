import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreditLine, Operator, User } from "src/database/entities";

import { BackOfficeController } from "./backoffice.controller";
import { BackOfficeService } from "./backoffice.service";
import { UserModule } from "../user/user.module";
import { CreditLineModule } from "../credit-line/credit-line.module";

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Operator, User, CreditLine]),
        CreditLineModule,
        UserModule,
    ],
    exports: [BackOfficeService],
    providers: [BackOfficeService],
    controllers: [BackOfficeController],
})
export class BackOfficeModule {}
