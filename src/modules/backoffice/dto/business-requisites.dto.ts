import { IsNumber, IsString } from "class-validator";

export class BusinesRequisitesDto {
    @IsNumber()
    page = 1;

    @IsString()
    sortField: "bankName" | "iban" = "bankName";

    @IsString()
    sortDirection: "ASC" | "DESC" = "ASC";
}
