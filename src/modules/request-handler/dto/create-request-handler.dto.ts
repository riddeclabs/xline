import { IsNumber, IsString, IsEnum } from "class-validator";
import { BorrowRequestStatus } from "src/common";

export class CreateDepositRequestHandlerDto {
    @IsNumber()
    readonly creditLineId!: number;
}
export class CreateWithdrawRequestHandlerDto {
    @IsNumber()
    readonly creditLineId!: number;
    @IsString()
    readonly walletToWithdraw!: string;
    readonly withdrawAmount!: bigint;
}
export class CreateBorrowRequestHandlerDto {
    @IsNumber()
    readonly creditLineId!: number;
    readonly borrowFiatAmount!: bigint | null;
    readonly initialRiskStrategy!: bigint | null;
    @IsEnum(BorrowRequestStatus)
    readonly borrowRequestStatus!: BorrowRequestStatus;
}
export class CreateRepayRequestHandlerDto {
    @IsNumber()
    readonly creditLineId!: number;
    @IsNumber()
    readonly businessPaymentRequisiteId!: number;
}
