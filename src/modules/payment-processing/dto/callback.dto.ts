import { IsNumber, IsString, IsOptional, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { CallbackTransactionStatus, CallbackTypes } from "../payment-processing.types";

export class CryptoCallbackDto {
    @IsString()
    @ApiProperty({
        description: "Amount of the transaction. 1e18 is equivalent 1 ETH",
        example: "1.000000000000000001",
    })
    readonly amount!: string;

    @IsString()
    @ApiProperty({
        description: "Currency of the transaction",
        example: "ETH",
    })
    readonly currency!: string;

    @IsString()
    @ApiProperty({
        description: "A unique ID you have for the customer who made the deposit",
        example: "9548724848",
    })
    readonly customerId!: string;

    @IsEnum(CallbackTypes)
    @ApiProperty({
        description: `Type of the Transaction`,
        example: CallbackTypes.DEPOSIT,
    })
    readonly type!: CallbackTypes;

    @IsEnum(CallbackTransactionStatus)
    @ApiProperty({
        description: `Status of the Transaction`,
        example: CallbackTransactionStatus.CONFIRMED,
    })
    readonly status!: CallbackTransactionStatus;

    @IsNumber()
    @ApiProperty({
        description: "Amount converted to EUR (at the time of transaction confirmation)",
        example: 1245.2587,
    })
    readonly eur!: number;

    @IsNumber()
    @ApiProperty({
        description: "Amount converted to USD (at the time of transaction confirmation)",
        example: 1145.2914,
    })
    readonly usd!: number;

    @IsString()
    @ApiProperty({
        description:
            "Generated using sha512 algorithm hash that includes transaction ID, customer ID, amount, currency, and secret key",
        example:
            "EpeN4GbIzzgWDbs58meGmTKTCCWdB8VrDfaWdodWarF8IeVQrFg7sdY8b6mzOCklswQWusMXumzJ/kcJsV5OUQ==",
    })
    readonly hash!: string;

    @IsString()
    @ApiProperty({
        description: "A unique transaction ID",
        example: "6c1846a5-d941-4842-af2d-969d342facc3",
    })
    readonly id!: string;

    @IsString()
    @ApiProperty({
        description: "Hash of the transaction in network",
        example: "0xAbcDeF1234567890AbCdEf1234567890aBcDeF12",
    })
    readonly txHash!: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: "The invoice identification in the XGateway system",
        example: "9b2451a5-d941-4842-af2d-969d342facc3",
    })
    readonly invoiceId!: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        description: "The invoice identification in the merchant system",
        example: "9b2451a5-d941-4842-af2d-969d342facc3",
    })
    readonly orderId!: string;
}
