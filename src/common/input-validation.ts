import { electronicFormatIBAN, validateIBAN, ValidateIBANResult, ValidationErrorsIBAN } from "ibantools";
import { CollateralCurrency } from "../database/entities";
import { parseUnits } from "./fixed-number";
import { SUPPORTED_TOKENS } from "../modules/bot/constants";
import { isAddress as validateEthAddress } from "ethers";
import { validate as validateBtcAddress } from "bitcoin-address-validation";

export enum WithdrawSceneValidationStatus {
    INCORRECT_STRUCT_OR_ZERO,
    INCORRECT_DECIMALS,
    EXCEEDS_MAX_AMOUNT,
    CORRECT,
}

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

/**
 Validates the user input value for a withdrawal transaction.
 @param {string} inputValue - The user-provided input value to be validated.
 @param {CollateralCurrency} collateralCurrency - The collateral currency used in the transaction.
 @param {bigint} maxAllowedWithdrawAmount - The maximum allowed withdrawal amount.
 @returns {WithdrawSceneValidationStatus} - The validation status.
 @description Validates the user input value for a withdrawal transaction. It checks accuracy, format, and maximum amount.
 Returns the corresponding validation status
 */
export function validateWithdrawInputValue(
    inputValue: string,
    collateralCurrency: CollateralCurrency,
    maxAllowedWithdrawAmount: bigint
): WithdrawSceneValidationStatus {
    let formattedValue;

    try {
        // We use helper function `parseUnits` to validate if the struct of user input is correct.
        // Function validate amount accuracy, format and etc
        formattedValue = parseUnits(inputValue, collateralCurrency.decimals);
    } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("exceeds decimals")) {
            return WithdrawSceneValidationStatus.INCORRECT_DECIMALS;
        }
        return WithdrawSceneValidationStatus.INCORRECT_STRUCT_OR_ZERO;
    }

    if (formattedValue <= 0n) {
        return WithdrawSceneValidationStatus.INCORRECT_STRUCT_OR_ZERO;
    }

    if (formattedValue > maxAllowedWithdrawAmount) {
        return WithdrawSceneValidationStatus.EXCEEDS_MAX_AMOUNT;
    }

    return WithdrawSceneValidationStatus.CORRECT;
}

export function validateAddressToWithdraw(inputValue: string, collateralCurrency: CollateralCurrency) {
    let isValid = false;

    switch (collateralCurrency.symbol) {
        case SUPPORTED_TOKENS.ETH:
            isValid = validateEthAddress(inputValue);
            break;
        case SUPPORTED_TOKENS.BTC:
            isValid = validateBtcAddress(inputValue);
            break;
        default:
            throw new Error("Unsupported currency. Cannot validate the address");
    }

    return isValid;
}
