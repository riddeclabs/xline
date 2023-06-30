import { electronicFormatIBAN, validateIBAN, ValidateIBANResult, ValidationErrorsIBAN } from "ibantools";
import { CollateralCurrency } from "../database/entities";
import { parseUnits } from "./fixed-number";
import { SUPPORTED_TOKENS } from "../modules/bot/constants";
import { isAddress as validateEthAddress } from "ethers";
import { validate as validateBtcAddress } from "bitcoin-address-validation";

export enum WithdrawSceneIncorrectInputReason {
    INCORRECT_STRUCT_OR_ZERO,
    INCORRECT_DECIMALS,
    EXCEEDS_MAX_AMOUNT,
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
 @description
 This function validates the user-provided input value for a withdrawal transaction. It ensures the input value meets the required criteria,
 including accuracy, format, and maximum allowed amount.
 If the input value is incorrect, it returns the corresponding error reason.
 If the input value is valid, it returns null.
 @param {string} inputValue - The user-provided input value to be validated.
 @param {CollateralCurrency} collateralCurrency - The collateral currency used in the transaction.
 @param {bigint} maxAllowedWithdrawAmount - The maximum allowed withdrawal amount.
 @returns {WithdrawSceneIncorrectInputReason | null} - The reason for incorrect input if any, or null if the input is valid.
 @throws {Error} - If the input value exceeds the defined number of decimals for the collateral currency.

 */
export function validateWithdrawInputValue(
    inputValue: string,
    collateralCurrency: CollateralCurrency,
    maxAllowedWithdrawAmount: bigint
): WithdrawSceneIncorrectInputReason | null {
    let formattedValue;

    try {
        // We use helper function `parseUnits` to validate if the struct of user input is correct.
        // Function validate amount accuracy, format and etc
        formattedValue = parseUnits(inputValue, collateralCurrency.decimals);
    } catch (e: unknown) {
        if (e instanceof Error && e.message.includes("exceeds decimals")) {
            return WithdrawSceneIncorrectInputReason.INCORRECT_DECIMALS;
        }
        return WithdrawSceneIncorrectInputReason.INCORRECT_STRUCT_OR_ZERO;
    }

    if (formattedValue <= 0n) {
        return WithdrawSceneIncorrectInputReason.INCORRECT_STRUCT_OR_ZERO;
    }

    if (formattedValue > maxAllowedWithdrawAmount) {
        return WithdrawSceneIncorrectInputReason.EXCEEDS_MAX_AMOUNT;
    }

    return null;
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
