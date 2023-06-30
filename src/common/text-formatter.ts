/**
 * Converts a numeric or string value to Markdown format by replacing the decimal point with '`.`'.
 * @param {number | string} value - The value to be converted.
 * @returns {string} The value formatted in Markdown.
 *
 * @example
 * floatToMd(3.14159); // Returns "3`.`14159"
 *
 * floatToMd("2.71828"); // Returns "2`.`71828"
 */
export function floatToMd(value: number | string): string {
    const stringValue = typeof value === "number" ? value.toString() : value;
    return stringValue.replace(".", "`.`");
}

/**
 * Truncates the decimal part of a numeric or string value.
 * @param {string | number} value - The value to be truncated.
 * @param {number} [accuracy=2] - The number of decimal places to keep.
 * @param {boolean} [md=true] - Indicates whether the result should be formatted in Markdown.
 * @returns {string} The truncated value.
 * @throws {Error} If the source string is incorrect (missing integer part or has more than one decimal part).
 *
 * @example
 * truncateDecimalToStr(10.12345); // Returns "10`.`12"
 *
 * truncateDecimalToStr("15.9876", 1, false); // Returns "15.9"
 *
 * truncateDecimalToStr(5.8, 0, false); // Returns "5"
 */
export function truncateDecimalsToStr(value: string | number, accuracy = 2, md = true): string {
    const res = truncateDecimals(value, accuracy);
    return md ? floatToMd(res) : res.toString();
}

export function truncateDecimals(value: number | string, decimals: number): number {
    const valueStr = typeof value === "string" ? value : value.toString();
    const dotIndex = valueStr.indexOf(".");
    if (dotIndex === -1) {
        return Number(valueStr);
    }

    if (checkIfAllZeros(valueStr.slice(dotIndex + 1, dotIndex + decimals + 1))) {
        return Number(valueStr.slice(0, dotIndex));
    } else {
        return Number(valueStr.slice(0, dotIndex + decimals + 1));
    }
}

/**
 * Checks if a string consists of all zeros.
 * @param {string} value - The string value to check.
 * @returns {boolean} A boolean indicating whether the string consists of all zeros.
 *
 * @example
 * checkIfAllZeros("0000"); // Returns true
 *
 * checkIfAllZeros("1000"); // Returns false
 */
function checkIfAllZeros(value: string) {
    return /^0*$/.test(value);
}
