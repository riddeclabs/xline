import { IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResolveCryptoBasedRequestDto {
    @IsString()
    chatId!: string;
    @IsString()
    collateralSymbol!: string;
    @IsString()
    callbackType!: string;
    @IsString()
    rawTransferAmount!: string;
    @IsString()
    usdTransferAmount!: string;
    @IsString()
    txHash!: string;
    @IsString()
    paymentProcessingTxId!: string;
}

export class ResolveFiatBasedRequestDto {
    @IsNumber()
    requestId!: number;
    @IsString()
    ibanFrom!: string;
    @IsString()
    ibanTo!: string;
    @IsString()
    nameFrom!: string;
    @IsString()
    nameTo!: string;
    @IsString()
    rawTransferAmount!: string;
    @IsString()
    status!: string;
}

export class ResolveRepayRequestDto {
    @ApiProperty({
        description: "ID of the request to resolve",
        example: 1,
    })
    @IsNumber()
    requestId!: number;
    @ApiProperty({
        description: "IBAN from which the money was received",
        example: "AD14 0008 0001 0012 3456 7890",
    })
    @IsString()
    ibanFrom!: string;
    @ApiProperty({
        description: "Bank account name from which the money was received",
        example: "John Doe",
    })
    @IsString()
    nameFrom!: string;
    @ApiProperty({
        description: "Amount that has been received",
        example: "100.50",
    })
    @IsString()
    rawTransferAmount!: string;
}
