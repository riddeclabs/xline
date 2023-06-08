import { IsNumber, IsEnum, IsOptional, IsString } from "class-validator";

import { Role } from "src/common";

import { CustomersListColumns } from "../backoffice.service";

export class CustomersListDto {
    @IsNumber()
    page = 1;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @IsEnum(CustomersListColumns)
    sort: CustomersListColumns = CustomersListColumns.name;

    @IsString()
    chatId?: string;

    @IsString()
    @IsOptional()
    username?: string;
}
