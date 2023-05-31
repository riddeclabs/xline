import { IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

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

    @IsString()
    @ApiProperty({
        description: `"DEPOSIT" or "WITHDRAWAL"`,
        example: "DEPOSIT",
    })
    readonly type!: string;

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
}
