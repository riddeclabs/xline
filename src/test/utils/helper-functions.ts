import { parseUnits } from "../../common";
import * as crypto from "crypto";
import { ethers } from "ethers";

export function generateCurrencySymbol(length: number, isFiatSymbol = true): string {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let reference = isFiatSymbol ? "FIAT_" : "CRYPTO_";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        reference += characters.charAt(randomIndex);
    }
    return reference;
}

export function generateChatId(length: number): number {
    const characters = "0123456789";
    let reference = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        reference += characters.charAt(randomIndex);
    }
    return Number(reference);
}

export function generateRandomBigintInRange(min: number, max: number, accuracy = 4): bigint {
    const randomNum = Math.random() * (max - min) + min;
    return parseUnits(randomNum.toFixed(accuracy));
}

export function generateRandomEthereumAddress(): string {
    return ethers.getAddress("0x" + crypto.randomBytes(20).toString("hex"));
}

export function generateRandomTransactionHash(): string {
    return "0x" + crypto.randomBytes(32).toString("hex");
}
