import { IsIBAN, IsNumber, IsString } from "class-validator";

export class CreateBusinessPaymentRequisiteDto {
    @IsNumber()
    readonly debtCurrencyId!: number;
    @IsString()
    readonly bankName!: string;
    @IsIBAN()
    readonly iban!: string;
}
export class CreateUserPaymentRequisiteDto {
    @IsNumber()
    readonly userId!: number;
    @IsNumber()
    readonly debtCurrencyId!: number;
    @IsIBAN()
    readonly iban!: string;
}
