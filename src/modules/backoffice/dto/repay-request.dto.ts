import { IsNumber, IsEnum, IsOptional, IsString } from "class-validator";

import { BorrowRequestColumns } from "../backoffice.service";

export class RepayRequestDto {
    @IsNumber()
    page = 1;

    @IsEnum(BorrowRequestColumns)
    sort: BorrowRequestColumns = BorrowRequestColumns.createdAt;

    @IsString()
    @IsOptional()
    chatId?: string;

    @IsString()
    @IsOptional()
    refNumber?: string;
}
