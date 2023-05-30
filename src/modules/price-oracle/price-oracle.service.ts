import { Injectable } from "@nestjs/common";
import axios from "axios";
import { BINANCE_PRICE_FEED_URL, BTC_USDT_PAIR, ETH_USDT_PAIR } from "./constants";
import { SUPPORTED_TOKENS } from "../bot/constants";
import { parseUnits } from "../../common/fixed-number";
import { EXP_SCALE } from "../../common/constants";

@Injectable()
export class PriceOracleService {
    // Returns raw token price in float format by token Symbol
    async getTokenPriceBySymbol(tokenSymbol: string) {
        const pair = this.getTokenPairBySymbol(tokenSymbol);
        return this.getTokenPriceByPair(pair);
    }

    // Note! scaledCryptoAmount - rawCryptoAmount must be scaled by 1e18 to get usd value with correct accuracy ( 1e18 )
    async convertCryptoToUsd(collateralSymbol: string, scaledCryptoAmount: bigint) {
        const tokenPair = this.getTokenPairBySymbol(collateralSymbol);
        const tokenPrice = await this.getTokenPriceByPair(tokenPair);
        const scaledPrice = parseUnits(tokenPrice);

        return (scaledCryptoAmount * scaledPrice) / EXP_SCALE;
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
}
