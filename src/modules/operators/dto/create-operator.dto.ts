import { IsString, IsEnum } from "class-validator";

import { Role } from "src/common";

export class CreateOperatorDto {
    @IsString()
    readonly username!: string;

    @IsString()
    readonly password!: string;

    @IsEnum(Role)
    readonly role!: Role;
}
