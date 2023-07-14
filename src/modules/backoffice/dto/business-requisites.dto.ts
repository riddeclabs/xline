import { IsNumber, IsString } from "class-validator";

export class BusinesRequisitesDto {
    @IsNumber()
    page = 1;

    @IsString()
    sortField: "bankName" | "iban" | "createdAt" = "createdAt";

    @IsString()
    sortDirection: "ASC" | "DESC" = "DESC";
}
