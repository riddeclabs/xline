import { IsNumber, IsString } from "class-validator";
import { IsBigInt } from "../../../decorators/class-validator-extended.decorator";

export class CreateDepositRequestHandlerDto {
    @IsNumber()
    readonly creditLineId!: number;
}
export class CreateWithdrawRequestHandlerDto {
    @IsNumber()
    readonly creditLineId!: number;
    @IsString()
    readonly walletToWithdraw!: string;
    @IsBigInt()
    readonly withdrawAmount!: bigint;
}
export class CreateBorrowRequestHandlerDto {
    @IsNumber()
    readonly creditLineId!: number;
    readonly borrowFiatAmount!: bigint | null;
    readonly initialRiskStrategy!: bigint | null;
}
export class CreateRepayRequestHandlerDto {
    @IsNumber()
    readonly creditLineId!: number;
    @IsNumber()
    readonly businessPaymentRequisiteId!: number;
}
