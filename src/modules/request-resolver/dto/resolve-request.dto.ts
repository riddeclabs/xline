import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

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
    @ApiProperty({
        description: "ID of the request to resolve",
        example: 1,
    })
    @IsNumber()
    requestId!: number;

    @ApiProperty({
        description: "IBAN from which the money were sent",
        example: "AD14 0008 0001 0012 3456 7890",
    })
    @IsString()
    ibanFrom!: string;

    @ApiProperty({
        description: "Amount that has been received",
        example: "100.50",
    })
    @IsString()
    rawTransferAmount!: string;
}

export class ResolveBorrowRequestDto extends ResolveFiatBasedRequestDto {}

export class ResolveRepayRequestDto extends ResolveFiatBasedRequestDto {
    @ApiProperty({
        description: "Bank account name from which the money were sent",
        example: "John Doe",
    })
    @IsString()
    nameFrom!: string;
}

export class FinalizeOrRejectBorrowRequestDto {
    @ApiProperty({
        description: "ID of the request to finalize or reject",
        example: 1,
    })
    @IsNumber()
    requestId!: number;
}
