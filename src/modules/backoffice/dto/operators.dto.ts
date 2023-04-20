import { IsNumber, IsEnum, IsOptional, IsString } from "class-validator";

import { Role } from "src/common";

import { OperatorsListColumns } from "../backoffice.service";

export class OperatorsListDto {
    @IsNumber()
    page = 1;

    @IsEnum(Role)
    @IsOptional()
    role?: Role;

    @IsEnum(OperatorsListColumns)
    sort: OperatorsListColumns = OperatorsListColumns.updated;

    @IsString()
    @IsOptional()
    username?: string;
}
