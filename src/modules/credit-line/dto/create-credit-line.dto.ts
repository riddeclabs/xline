import { IsBoolean, IsNumber, IsString } from "class-validator";

export class CreateCreditLineDto {
    @IsNumber()
    readonly userPaymentRequisiteId!: number;
    @IsNumber()
    readonly userId!: number;
    @IsNumber()
    readonly gatewayUserId!: string;
    @IsNumber()
    readonly economicalParametersId!: number;
    @IsNumber()
    readonly debtCurrencyId!: number;
    @IsNumber()
    readonly collateralCurrencyId!: number;
    @IsString()
    readonly refNumber!: string;
    @IsBoolean()
    readonly isLiquidated!: boolean;
}
