import { IsNumber, IsEnum, IsOptional, IsString } from "class-validator";

import { CustomersListColumns } from "../backoffice.service";

export class CustomersListDto {
    @IsNumber()
    page = 1;

    @IsEnum(CustomersListColumns)
    sort: CustomersListColumns = CustomersListColumns.name;

    @IsString()
    @IsOptional()
    chatId?: string;

    @IsString()
    @IsOptional()
    username?: string;
}
