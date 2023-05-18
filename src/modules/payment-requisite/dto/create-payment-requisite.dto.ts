import { IsNumber, IsString } from "class-validator";

export class CreateBusinessPaymentRequisiteDto {
    @IsNumber()
    readonly debtCurrencyId!: number;
    @IsString()
    readonly bankName!: string;
    @IsString()
    readonly iban!: string;
}
export class CreateUserPaymentRequisiteDto {
    @IsNumber()
    readonly userId!: number;
    @IsNumber()
    readonly debtCurrencyId!: number;
    @IsNumber()
    readonly iban!: string;
}
