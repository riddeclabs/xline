import { electronicFormatIBAN, validateIBAN, ValidateIBANResult, ValidationErrorsIBAN } from "ibantools";

export function validateIban(input: string): ValidateIBANResult {
    const iban = electronicFormatIBAN(input);
    if (!iban) return { valid: false, errorCodes: [ValidationErrorsIBAN.NoIBANProvided] };
    return validateIBAN(iban);
}

export function validateName(input: string): boolean {
    if (input.split(" ").length < 2) return false;
    return /^[A-Za-z\s]*$/.test(input);
}

// decimals - number of decimals allowed after the dot
export function validateAmountDecimals(amount: number, decimals: number): boolean {
    const regex = new RegExp(`^[0-9]+(\\.[0-9]{1,${decimals}})?$`);
    return regex.test(amount.toString());
}
