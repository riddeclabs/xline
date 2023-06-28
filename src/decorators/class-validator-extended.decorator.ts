import { validate } from "class-validator";
export async function validateDto(dtoClass: any) {
    const validationErrors = await validate(dtoClass);
    if (validationErrors[0]) {
        throw new Error(validationErrors[0].toString());
    }
}
