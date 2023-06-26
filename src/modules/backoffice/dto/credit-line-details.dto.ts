import { IsOptional, IsString } from "class-validator";

export class CreditLineDetailsDto {
    @IsString()
    @IsOptional()
    createdAt?: string;
}
