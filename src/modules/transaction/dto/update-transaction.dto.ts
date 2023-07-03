import { PartialType } from "@nestjs/mapped-types";
import { CreateFiatTransactionDto } from "./create-transaction.dto";

export class UpdateFiatTransactionDto extends PartialType(CreateFiatTransactionDto) {}
