import { Injectable } from "@nestjs/common";
import { CreateCreditLineDto } from "./dto/create-credit-line.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CreditLine } from "../../database/entities";
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

    async updateDebtAmountAndFeeAccumulatedById(
        creditLineId: number,
        newDebtAmount: bigint,
        newFeeAccumulatedAmount: bigint
    ) {
        return this.creditLineRepo
            .createQueryBuilder()
            .update()
            .set({ debtAmount: newDebtAmount, feeAccumulatedFiatAmount: newFeeAccumulatedAmount })
            .where("id = :creditLineId", { creditLineId })
            .execute();
    }

    async decreaseDebtAmountById(creditLine: CreditLine, subAmount: bigint) {
        creditLine.debtAmount = creditLine.debtAmount - subAmount;
        return this.creditLineRepo.save(creditLine);
    }

    async updateSupplyAmountById(creditLineId: number, newSupplyAmount: bigint) {
        return this.creditLineRepo
            .createQueryBuilder()
            .update()
            .set({ rawCollateralAmount: newSupplyAmount })
            .where("id = :creditLineId", { creditLineId })
            .execute();
    }

    async getCreditLineByChatIdAndColSymbol(
        chatId: number,
        collateralSymbol: string
    ): Promise<CreditLine | null> {
        return await this.creditLineRepo
            .createQueryBuilder("creditLine")
            .leftJoin("creditLine.user", "user")
            .leftJoinAndSelect("creditLine.collateralCurrency", "cc")
            .leftJoinAndSelect("creditLine.economicalParameters", "ep")
            .where("user.chatId = :chatId", { chatId })
            .andWhere("cc.symbol = :collateralSymbol", { collateralSymbol })
            .getOne();
    }

    async getCreditLinesByChatIdCurrencyExtended(chatId: number): Promise<CreditLineCurrencyExtended[]> {
        return await this.creditLineRepo
            .createQueryBuilder("creditLine")
            .leftJoinAndSelect("creditLine.collateralCurrency", "collateralCurrency")
            .leftJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .leftJoin("creditLine.user", "user")
            .where("user.chatId = :chatId", { chatId })
            .getMany();
    }

    async getCreditLinesByIdCurrencyExtended(creditLineId: number): Promise<CreditLineCurrencyExtended> {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .innerJoinAndSelect("creditLine.collateralCurrency", "collateralCurrency")
            .innerJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .where("creditLine.id = :creditLineId", { creditLineId })
            .getOneOrFail();
    }
}
