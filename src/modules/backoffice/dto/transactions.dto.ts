import { IsNumber, IsOptional, IsString } from "class-validator";

export class TransactionsDto {
    @IsNumber()
    page = 1;

    @IsString()
    @IsOptional()
    sortField?: "created_at" | "type" | "status" | "updated_at";

    @IsString()
    @IsOptional()
    sortDirection?: "ASC" | "DESC";
}
