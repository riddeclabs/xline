import { Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import {
    CreditLineState,
    CreditRequest,
    EconomicModel,
    ProcessingSettings,
    RepayRequest,
    WithdrawRequest,
} from "src/database/entities";

@Module({
    imports: [
        CreditLineState,
        CreditRequest,
        EconomicModel,
        ProcessingSettings,
        RepayRequest,
        WithdrawRequest,
    ],
    providers: [DatabaseService],
})
export class DatabaseModule {}
