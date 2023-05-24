import { Module } from "@nestjs/common";
import { CurrencyService } from "./currency.service";
import { CurrencyController } from "./currency.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CollateralCurrency, DebtCurrency } from "../../database/entities";

@Module({
    imports: [TypeOrmModule.forFeature([CollateralCurrency, DebtCurrency])],
    controllers: [CurrencyController],
    providers: [CurrencyService],
    exports: [CurrencyService],
})
export class CurrencyModule {}
