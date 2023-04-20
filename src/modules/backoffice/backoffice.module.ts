import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Operator } from "src/database/entities";

import { BackOfficeController } from "./backoffice.controller";
import { BackOfficeService } from "./backoffice.service";

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([Operator])],
    exports: [BackOfficeService],
    providers: [BackOfficeService],
    controllers: [BackOfficeController],
})
export class BackOfficeModule {}
