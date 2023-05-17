import { IsNumber, IsString } from "class-validator";

export class CreateBusinessPaymentRequisiteDto {
    @IsNumber()
    readonly currencyId!: number;
    @IsString()
    readonly bankName!: string;
    @IsString()
    readonly iban!: string;
}
export class CreateUserPaymentRequisiteDto {
    @IsNumber()
    readonly chatId!: number;
    @IsNumber()
    readonly currencyId!: number;
    @IsNumber()
    readonly userIban!: string;
}
