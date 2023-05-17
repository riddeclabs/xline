import { PartialType } from "@nestjs/mapped-types";
import {
    CreateBorrowRequestHandlerDto,
    CreateDepositRequestHandlerDto,
    CreateRepayRequestHandlerDto,
    CreateWithdrawRequestHandlerDto,
} from "./create-request-handler.dto";

export class UpdateDepositRequestHandlerDto extends PartialType(CreateDepositRequestHandlerDto) {}
export class UpdateWithdrawRequestHandlerDto extends PartialType(CreateWithdrawRequestHandlerDto) {}
export class UpdateBorrowRequestHandlerDto extends PartialType(CreateBorrowRequestHandlerDto) {}
export class UpdateRepayRequestHandlerDto extends PartialType(CreateRepayRequestHandlerDto) {}
