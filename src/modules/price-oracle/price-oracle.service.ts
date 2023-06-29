import { Injectable } from "@nestjs/common";
import axios from "axios";
import { BINANCE_PRICE_FEED_URL, BTC_USDT_PAIR, ETH_USDT_PAIR } from "./constants";
import { SUPPORTED_TOKENS } from "../bot/constants";
import { parseUnits } from "../../common";
import { EXP_SCALE } from "../../common/constants";

@Injectable()
export class PriceOracleService {
    // Returns raw token price in float format by token Symbol
    async getTokenPriceBySymbol(tokenSymbol: string) {
        const pair = this.getTokenPairBySymbol(tokenSymbol);
        return this.getTokenPriceByPair(pair);
    }

    // Note! rawTokenAmount - is raw crypto amount and must be scaled in original accuracy
    async convertCryptoToUsd(
        tokenSymbol: string,
        tokenDecimals: number,
        rawTokenAmount: bigint,
        externalScaledPrice?: bigint
    ) {
        const scaledPrice = externalScaledPrice ?? (await this.getScaledTokenPriceBySymbol(tokenSymbol));
        const priceMultiplier = this.getPriceMultiplierByCryptoDecimals(tokenDecimals);

        return (rawTokenAmount * scaledPrice * priceMultiplier) / EXP_SCALE;
    }

    async convertUsdToCrypto(
        tokenSymbol: string,
        tokenDecimals: number,
        usdAmount: bigint,
        externalScaledPrice?: bigint
    ) {
        const scaledPrice = externalScaledPrice ?? (await this.getScaledTokenPriceBySymbol(tokenSymbol));
        const priceMultiplier = this.getPriceMultiplierByCryptoDecimals(tokenDecimals);

        return (usdAmount * EXP_SCALE) / (scaledPrice * priceMultiplier);
    }

    async getScaledTokenPriceBySymbol(tokenSymbol: string) {
        const tokenPair = this.getTokenPairBySymbol(tokenSymbol);
        const tokenPrice = await this.getTokenPriceByPair(tokenPair);
        return parseUnits(tokenPrice);
    }

    // Returns raw token price in float format
    private async getTokenPriceByPair(tokenPair: string) {
        let tokenPrice: string;
        try {
            const params = {
                symbol: tokenPair,
            };

            const response = await axios.get(BINANCE_PRICE_FEED_URL, { params });

            tokenPrice = response.data.price;
        } catch (error) {
            throw error;
        }
        if (!tokenPrice) {
            throw new Error("Incorrect token price received from oracle provider");
        }

        return tokenPrice;
    }

    private getTokenPairBySymbol(tokenSymbol: string) {
        switch (tokenSymbol) {
            case SUPPORTED_TOKENS.ETH:
                return ETH_USDT_PAIR;
            case SUPPORTED_TOKENS.BTC:
                return BTC_USDT_PAIR;
            default:
                throw new Error("Unsupported collateral token");
        }
    }

    private getPriceMultiplierByCryptoDecimals(cryptoDecimals: number) {
        const additionalDecimals = 18 - cryptoDecimals;

        return 10n ** BigInt(additionalDecimals);
    }
}
