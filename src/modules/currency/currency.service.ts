import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CollateralCurrency, DebtCurrency } from "../../database/entities";
import { Repository } from "typeorm";
import { CreateCurrencyDto } from "./dto/create-currency.dto";

@Injectable()
export class CurrencyService {
    constructor(
        @InjectRepository(CollateralCurrency)
        private collateralCurrencyRepo: Repository<CollateralCurrency>,
        @InjectRepository(DebtCurrency) private debtCurrencyRepo: Repository<DebtCurrency>
    ) {}

    async getCollateralCurrency(collateralCurrencyId: number) {
        return this.collateralCurrencyRepo.findOneByOrFail({ id: collateralCurrencyId });
    }

    async getDebtCurrency(debtCurrencyId: number) {
        return this.debtCurrencyRepo.findOneByOrFail({ id: debtCurrencyId });
    }

    async getAllCollateralCurrency() {
        return this.collateralCurrencyRepo.find();
    }

    async getAllDebtCurrency() {
        return this.debtCurrencyRepo.find();
    }

    async createCollateralCurrency(createCollateralCurrencyDto: CreateCurrencyDto) {
        const currency = this.collateralCurrencyRepo.create(createCollateralCurrencyDto);
        return this.collateralCurrencyRepo.save(currency);
    }

    async createDebtCurrency(createDebtCurrencyDto: CreateCurrencyDto) {
        const currency = this.debtCurrencyRepo.create(createDebtCurrencyDto);
        return this.debtCurrencyRepo.save(currency);
    }
}
