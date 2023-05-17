import { IsNumber, IsString } from "class-validator";

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
    readonly initRiskStrategy!: bigint | null;
}
export class CreateRepayRequestHandlerDto {
    @IsNumber()
    readonly creditLineId!: number;
    @IsNumber()
    readonly paymentRequisiteId!: number;
}
