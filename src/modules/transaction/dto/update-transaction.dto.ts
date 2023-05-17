import { PartialType } from "@nestjs/mapped-types";
import { CreateCryptoTransactionDto, CreateFiatTransactionDto } from "./create-transaction.dto";

export class UpdateFiatTransactionDto extends PartialType(CreateFiatTransactionDto) {}
export class UpdateCryptoTransactionDto extends PartialType(CreateCryptoTransactionDto) {}
