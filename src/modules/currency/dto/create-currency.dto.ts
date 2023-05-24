import { IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCurrencyDto {
    @ApiProperty({ description: "Token symbol", example: "BTC" })
    @IsString()
    readonly symbol!: string;
    @ApiProperty({ description: "Token decimals", example: 8 })
    @IsNumber()
    readonly decimals!: number;
}
