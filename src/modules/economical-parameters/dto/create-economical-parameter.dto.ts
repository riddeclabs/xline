import { IsNumber, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateEconomicalParameterDto {
    @ApiProperty({ description: "Collateral currency ID", example: 1 })
    @IsNumber()
    collateralCurrencyId!: number;
    @ApiProperty({ description: "Debt currency ID", example: 2 })
    @IsNumber()
    debtCurrencyId!: number;
    @ApiProperty({ description: "Annual percentage rate. 0.12 is 12%", example: "0.12" })
    @IsString()
    apr!: string;
    @ApiProperty({ description: "Liquidation fee rate. 0.05 is 5%", example: "0.05" })
    @IsString()
    liquidationFee!: string;
    @ApiProperty({ description: "Collateral factor rate. 0.7 is 70%", example: "0.7" })
    @IsString()
    collateralFactor!: string;
    @ApiProperty({ description: "Liquidation factor rate. 0.9 is 90%", example: "0.9" })
    @IsString()
    liquidationFactor!: string;
    @ApiProperty({ description: "Processing fee for fiat operations. 0.01 is 1%", example: "0.01" })
    @IsString()
    fiatProcessingFee!: string;
    @ApiProperty({
        description: "Processing fee for crypto operations. 0.005 is 0.5%",
        example: "0.005",
    })
    @IsString()
    cryptoProcessingFee!: string;
}
