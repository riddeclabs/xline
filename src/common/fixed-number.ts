export function parseUnits(value: string | number, decimals = 18): bigint {
    if (typeof value === "number") {
        value = value.toString();
    }

    if (decimals == null) {
        decimals = 0;
    }
    const multiplier = getMultiplier(decimals);

    // Is it negative?
    const negative = value.substring(0, 1) === "-";
    if (negative) {
        value = value.substring(1);
    }

    // Split it into a whole and fractional part
    const comps = value.split(".");
    if (comps.length > 2) {
        throw new Error(`ParseUnitsBigInt: Too many decimal points. Value: ${value}`);
    }

    let whole = comps[0];
    let fraction = comps[1];

    if (!whole) {
        whole = "0";
    }
    if (!fraction) {
        fraction = "0";
    }

    // Trim trailing zeros
    while (fraction[fraction.length - 1] === "0") {
        fraction = fraction.substring(0, fraction.length - 1);
    }
    if (fraction.length > multiplier.length - 1) {
        throw new Error("Fractional component exceeds decimals");
    }

    // If decimals is 0, we have an empty string for fraction
    if (fraction === "") {
        fraction = "0";
    }
    // Fully pad the string with zeros to get to wei
    while (fraction.length < multiplier.length - 1) {
        fraction += "0";
    }

    const wholeValue = BigInt(whole);
    const fractionValue = BigInt(fraction);

    let wei = wholeValue * BigInt(multiplier) + fractionValue;
    if (negative) {
        wei = wei * BigInt(-1);
    }

    return wei;
}

export function formatUnits(value: bigint, decimals = 18): string {
    if (decimals == null) {
        decimals = 0;
    }
    const multiplier = getMultiplier(decimals);

    const negative = value < 0n;
    if (negative) {
        value = value * BigInt(-1);
    }

    let fraction = (value % BigInt(multiplier)).toString();
    while (fraction.length < multiplier.length - 1) {
        fraction = "0" + fraction;
    }

    // Strip training 0
    const match = fraction.match(/^([0-9]*[1-9]|0)(0*)/);

    fraction = match && match[1] ? match[1] : "0";

    const whole = (value / BigInt(multiplier)).toString();

    let res: string;
    if (multiplier.length === 1) {
        res = whole;
    } else {
        res = whole + "." + fraction;
    }

    if (negative) {
        res = "-" + res;
    }

    return res;
}

function getMultiplier(decimals: number): string {
    let zeros = "";
    if (decimals >= 0 && decimals <= 256 && !(decimals % 1)) {
        while (decimals > 0) {
            zeros += "0";
            decimals -= 1;
        }
        return "1" + zeros;
    }

    throw new Error(`Incorrect decimal value. decimals: ${decimals}`);
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
