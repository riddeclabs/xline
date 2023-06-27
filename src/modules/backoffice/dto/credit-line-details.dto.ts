import { IsNumber, IsString } from "class-validator";

export class CreditLineDetailsDto {
    @IsNumber()
    page = 1;

    @IsString()
    sortField: "created_at" | "type" | "status" | "updated_at" = "created_at";

    @IsString()
    sortDirection: "ASC" | "DESC" = "ASC";
}
