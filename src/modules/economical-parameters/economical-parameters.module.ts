import { Module } from "@nestjs/common";
import { EconomicalParametersService } from "./economical-parameters.service";
import { EconomicalParametersController } from "./economical-parameters.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EconomicalParameters } from "../../database/entities";

@Module({
    imports: [TypeOrmModule.forFeature([EconomicalParameters])],
    controllers: [EconomicalParametersController],
    providers: [EconomicalParametersService],
    exports: [EconomicalParametersService],
})
export class EconomicalParametersModule {}
