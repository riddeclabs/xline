import { Module } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { TransactionController } from "./transaction.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CryptoTransaction, FiatTransaction } from "../../database/entities";

@Module({
    imports: [TypeOrmModule.forFeature([CryptoTransaction, FiatTransaction])],
    controllers: [TransactionController],
    providers: [TransactionService],
    exports: [TransactionService],
})
export class TransactionModule {}
