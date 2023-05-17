import { PartialType } from "@nestjs/mapped-types";
import {
    CreateBusinessPaymentRequisiteDto,
    CreateUserPaymentRequisiteDto,
} from "./create-payment-requisite.dto";

export class UpdateUserPaymentRequisiteDto extends PartialType(CreateUserPaymentRequisiteDto) {}
export class UpdateBusinessPaymentRequisiteDto extends PartialType(CreateBusinessPaymentRequisiteDto) {}
