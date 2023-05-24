import { Module } from "@nestjs/common";
import { RequestHandlerService } from "./request-handler.service";
import { RequestHandlerController } from "./request-handler.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BorrowRequest, DepositRequest, RepayRequest, WithdrawRequest } from "../../database/entities";

@Module({
    imports: [TypeOrmModule.forFeature([DepositRequest, WithdrawRequest, RepayRequest, BorrowRequest])],
    controllers: [RequestHandlerController],
    providers: [RequestHandlerService],
    exports: [RequestHandlerService],
})
export class RequestHandlerModule {}
