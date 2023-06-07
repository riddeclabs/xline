import { Injectable } from "@nestjs/common";
import { CreateCreditLineDto } from "./dto/create-credit-line.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CollateralCurrency, CreditLine, DebtCurrency } from "../../database/entities";
import { Repository } from "typeorm";
import { CreditLineCurrencyExtended } from "./credit-line.types";

@Injectable()
export class CreditLineService {
    constructor(@InjectRepository(CreditLine) private creditLineRepo: Repository<CreditLine>) {}

    async getCreditLineById(creditLineId: number) {
        return this.creditLineRepo.findOneByOrFail({ id: creditLineId });
    }

    async getAllCreditLines() {
        return this.creditLineRepo.find();
    }

    async saveNewCreditLine(newCreditLineDto: CreateCreditLineDto) {
        const newLine = this.creditLineRepo.create(newCreditLineDto);
        return this.creditLineRepo.save(newLine);
    }

    async increaseDebtAmountById(creditLine: CreditLine, addAmount: bigint) {
        creditLine.debtAmount = creditLine.debtAmount + addAmount;
        return this.creditLineRepo.save(creditLine);
    }
    async decreaseDebtAmountById(creditLine: CreditLine, subAmount: bigint) {
        creditLine.debtAmount = creditLine.debtAmount - subAmount;
        return this.creditLineRepo.save(creditLine);
    }
    async increaseSupplyAmountById(creditLine: CreditLine, addAmount: bigint) {
        creditLine.rawCollateralAmount = creditLine.rawCollateralAmount + addAmount;
        return this.creditLineRepo.save(creditLine);
    }
    async decreaseSupplyAmountById(creditLine: CreditLine, subAmount: bigint) {
        creditLine.rawCollateralAmount = creditLine.rawCollateralAmount - subAmount;
        return this.creditLineRepo.save(creditLine);
    }

    async getCreditLineByChatIdAndColSymbol(chatId: number, collateralSymbol: string) {
        return await this.creditLineRepo
            .createQueryBuilder("creditLine")
            .innerJoin("creditLine.userId", "user")
            .innerJoinAndSelect("creditLine.collateralCurrencyId", "cc")
            .where("user.chat_id = :chatId", { chatId })
            .andWhere("cc.symbol = :collateralSymbol", { collateralSymbol })
            .getOneOrFail();
    }

    async getCreditLinesByChatIdCurrencyExtended(chatId: number): Promise<CreditLineCurrencyExtended[]> {
        const creditLines = await this.creditLineRepo
            .createQueryBuilder("creditLine")
            .innerJoinAndSelect("creditLine.collateralCurrencyId", "collateralCurrency")
            .innerJoinAndSelect("creditLine.debtCurrencyId", "debtCurrency")
            .leftJoin("creditLine.userId", "user")
            .where("user.chat_id = :chatId", { chatId })
            .getMany();

        return creditLines.map(this.extendCreditLineByCurrencies);
    }

    async getCreditLinesByIdCurrencyExtended(creditLineId: number): Promise<CreditLineCurrencyExtended> {
        const creditLine = await this.creditLineRepo
            .createQueryBuilder("creditLine")
            .innerJoinAndSelect("creditLine.collateralCurrencyId", "collateralCurrency")
            .innerJoinAndSelect("creditLine.debtCurrencyId", "debtCurrency")
            .where("creditLine.id = :creditLineId", { creditLineId })
            .getOneOrFail();

        return this.extendCreditLineByCurrencies(creditLine);
    }

    private extendCreditLineByCurrencies(creditLine: CreditLine): CreditLineCurrencyExtended {
        return {
            ...creditLine,
            collateralToken: creditLine.collateralCurrencyId as unknown as CollateralCurrency,
            debtToken: creditLine.debtCurrencyId as unknown as DebtCurrency,
        };
    }
}
