import { ValidationOptions, registerDecorator, ValidationArguments } from "class-validator";
import { validate } from "class-validator";

export async function validateDto(dtoClass: any) {
    const validationErrors = await validate(dtoClass);

    if (validationErrors[0]) {
        throw new Error(validationErrors[0].toString());
    }
}

export function IsBigInt(validationOptions: ValidationOptions = {}) {
    return function (object: Record<string, any>, propertyName: string) {
        registerDecorator({
            name: "isBigInt",
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return typeof value === "bigint";
                },
            },
        });
    };
}
