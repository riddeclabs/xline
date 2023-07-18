import { IsOptional, IsString } from "class-validator";

export class EconomicalParametersDto {
    @IsString()
    @IsOptional()
    debt?: string;

    @IsString()
    @IsOptional()
    collateral?: string;
}
