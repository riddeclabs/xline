import { PartialType } from "@nestjs/mapped-types";
import { CreatePaymentProcessingDto } from "./create-payment-processing.dto";

export class UpdatePaymentProcessingDto extends PartialType(CreatePaymentProcessingDto) {}
