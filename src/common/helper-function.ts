import { formatUnits } from "./fixed-number";
// FIXME: MOCK IMPLEMENTATION.
//      function returns random 8 symbol length string
export function generateReferenceNumber(): string {
    // Desired length of the reference number
    const length = 8;
    // Available characters for the reference number
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let reference = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        reference += characters.charAt(randomIndex);
    }

    return reference;
}

export function escapeSpecialCharacters(str: string): string {
    const symbols = [
        "_", // FIXME: add regexp to escape only if not used for italic text
        " * ", // * without spaces is used for bold text in markdown
        "[",
        "]",
        "(",
        ")",
        "~",
        "`",
        ">",
        "#",
        "+",
        "-",
        "=",
        "|",
        "{",
        "}",
        ".",
        "!",
    ];
    let result = str;
    symbols.forEach(symbol => {
        result = result.replaceAll(symbol, `\\${symbol}`);
    });
    return result;
}

export function bigintToFormattedPercent(value: bigint, decimals = 18): string {
    if (decimals < 2) throw new Error("Decimals must be greater than 2");

    let res = formatUnits(value, decimals - 2);

    if (res.includes(".")) {
        const [integer, fraction] = res.split(".");

        if (!integer) throw new Error("Integer part is empty");
        if (!fraction) throw new Error("Fraction part is empty");

        if (fraction.length > 1) {
            if (fraction.slice(0, 2) === "00") {
                res = integer;
            } else {
                res = integer + "." + fraction.slice(0, 2);
            }
        } else {
            if (fraction === "0") {
                res = integer;
            } else {
                res = integer + "." + fraction;
            }
        }
    }
    return res;
}

export function createUserGatewayId(chatId: number, currencyId: number) {
    return `${chatId}-${currencyId}`;
}

export function xor(a: any, b: any): boolean {
    return !!a !== !!b;
}
