import { Module } from "@nestjs/common";
import { PriceOracleService } from "./price-oracle.service";

@Module({
    providers: [PriceOracleService],
    exports: [PriceOracleService],
})
export class PriceOracleModule {}
