import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePaymentProcessingDto {
    @ApiProperty({ description: "The operator base url", example: "https://x-gateway.tech" })
    @IsString()
    readonly url!: string;

    @ApiProperty({ description: "The operator origin name", example: "X-Gateway" })
    @IsString()
    readonly originName!: string;

    @ApiProperty({
        description: "Operator auth hash (provided by X-Line)",
        example: "jneUuenf98efEF986",
    })
    @IsString()
    readonly callbackAuth!: string;

    @ApiProperty({
        description: "Operator auth hash (Provided by X-Gateway)",
        example: "jneUuenf98efEF986",
    })
    @IsString()
    readonly gatewayAuth!: string;
}
