import { PartialType } from "@nestjs/mapped-types";
import { CreateEconomicalParameterDto } from "./create-economical-parameter.dto";

export class UpdateEconomicalParameterDto extends PartialType(CreateEconomicalParameterDto) {}
