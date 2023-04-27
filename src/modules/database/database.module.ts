import { Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import {
    CreditLineState,
    CreditRequest,
    EconomicModel,
    ProcessingSettings,
    RepayRequest,
    WithdrawRequest,
} from "../../database/entities";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CreditLineState,
            CreditRequest,
            EconomicModel,
            ProcessingSettings,
            RepayRequest,
            WithdrawRequest,
        ]),
    ],
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule {}
