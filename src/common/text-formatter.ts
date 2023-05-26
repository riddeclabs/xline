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
export function floatToMd(value: number | string) {
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
 * truncateDecimal(10.12345); // Returns "10`.`12"
 *
 * truncateDecimal("15.9876", 1, false); // Returns "15.9"
 *
 * truncateDecimal(5.8, 0, false); // Returns "5"
 */
export function truncateDecimal(value: string | number, accuracy = 2, md = true): string {
    const stringValue = typeof value === "number" ? value.toString() : value;

    const parts = stringValue.split(".");

    if (!parts[0] || parts.length > 2) throw new Error("Incorrect source string");
    if (parts.length === 1) return parts[0];
    else {
        const fraction = parts[1]!.slice(0, accuracy);

        if (checkIfAllZeros(fraction)) {
            return parts[0];
        } else {
            const concatRes = parts[0] + "." + fraction;
            return md ? floatToMd(concatRes) : concatRes;
        }
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
