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
    @ApiProperty({ description: "Request ID", example: 1 })
    @IsNumber()
    requestId!: number;
    @ApiProperty({
        description: "IBAN funds where transferred from",
        example: "AL35202111090000000001234567",
    })
    @IsString()
    ibanFrom!: string;
    @ApiProperty({ description: "IBAN funds where transferred to", example: "AD1400080001001234567890" })
    @IsString()
    ibanTo!: string;
    @ApiProperty({
        description: "Name corresponding to bank account, funds where transferred from",
        example: "JOHN DOE",
    })
    @IsString()
    nameFrom!: string;
    @ApiProperty({
        description: "Name corresponding to bank account, funds where transferred to",
        example: "JANE DOE",
    })
    @IsString()
    nameTo!: string;
    @ApiProperty({ description: "Transferred amount", example: "2023.15" })
    @IsString()
    rawTransferAmount!: string;
    @ApiProperty({ description: "Status of transfer", example: "PENDING" })
    @IsString() // FIXME use isEnum
    status!: string;
}
