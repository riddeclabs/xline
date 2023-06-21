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

    async increaseDebtAmountById(creditLineId: number, addAmount: bigint): Promise<CreditLine> {
        this.creditLineRepo
            .createQueryBuilder()
            .update(CreditLine)
            .set({ debtAmount: () => "debtAmount + addAmount" })
            .where("id = :id", { id: creditLineId })
            .execute();

        return this.getCreditLineById(creditLineId);
    }

    async increaseAccumulatedFeeAmountById(
        creditLineId: number,
        addAmount: bigint
    ): Promise<CreditLine> {
        this.creditLineRepo
            .createQueryBuilder()
            .update(CreditLine)
            .set({ feeAccumulatedFiatAmount: () => "feeAccumulatedFiatAmount + addAmount" })
            .where("id = :id", { id: creditLineId })
            .execute();

        return this.getCreditLineById(creditLineId);
    }

    async decreaseDebtAmountById(creditLineId: number, subAmount: bigint) {
        this.creditLineRepo
            .createQueryBuilder()
            .update(CreditLine)
            .set({ debtAmount: () => "debtAmount - addAmount" })
            .where("id = :id", { id: creditLineId })
            .execute();

        return this.getCreditLineById(creditLineId);
    }

    async increaseSupplyAmountById(creditLineId: number, addAmount: bigint) {
        this.creditLineRepo
            .createQueryBuilder()
            .update(CreditLine)
            .set({ rawCollateralAmount: () => "rawCollateralAmount + addAmount" })
            .where("id = :id", { id: creditLineId })
            .execute();

        return this.getCreditLineById(creditLineId);
    }

    async decreaseSupplyAmountById(creditLineId: number, subAmount: bigint) {
        this.creditLineRepo
            .createQueryBuilder()
            .update(CreditLine)
            .set({ rawCollateralAmount: () => "rawCollateralAmount i addAmount" })
            .where("id = :id", { id: creditLineId })
            .execute();

        return this.getCreditLineById(creditLineId);
    }

    async getCreditLineByChatIdAndColSymbol(
        chatId: number,
        collateralSymbol: string
    ): Promise<CreditLine | null> {
        return await this.creditLineRepo
            .createQueryBuilder("creditLine")
            .leftJoin("creditLine.user", "user")
            .leftJoinAndSelect("creditLine.collateralCurrency", "cc")
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

    async getCreditLinesByIdAllSettingsExtended(
        creditLineId: number
    ): Promise<CreditLineCurrencyExtended> {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .innerJoinAndSelect("creditLine.collateralCurrency", "collateralCurrency")
            .innerJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .innerJoinAndSelect("creditLine.user", "user")
            .innerJoinAndSelect("creditLine.economicalParameters", "economicalParameters")
            .innerJoinAndSelect("creditLine.userPaymentRequisite", "userPaymentRequisite")
            .where("creditLine.id = :creditLineId", { creditLineId })
            .getOneOrFail();
    }
}
