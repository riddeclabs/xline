import { PartialType } from "@nestjs/mapped-types";
import { CreateCreditLineDto } from "./create-credit-line.dto";

export class UpdateCreditLineDto extends PartialType(CreateCreditLineDto) {}
