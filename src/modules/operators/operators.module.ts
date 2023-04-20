import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Operator } from "src/database/entities";

import { OperatorsController } from "./operators.controller";
import { OperatorsService } from "./operators.service";

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([Operator])],
    exports: [OperatorsService],
    controllers: [OperatorsController],
    providers: [OperatorsService],
})
export class OperatorsModule {}
