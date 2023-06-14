import { IsNumber, IsEnum, IsOptional, IsString } from "class-validator";

import { BorrowRequestColumns } from "../backoffice.service";

export class BorrowRequestDto {
    @IsNumber()
    page = 1;

    @IsEnum(BorrowRequestColumns)
    sort: BorrowRequestColumns = BorrowRequestColumns.updatedAt;

    @IsString()
    @IsOptional()
    chatId?: string;
}
