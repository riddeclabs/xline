import { Injectable } from "@nestjs/common";
import { CreateCreditLineDto } from "./dto/create-credit-line.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CreditLine } from "../../database/entities";
import { Repository, UpdateResult } from "typeorm";
import { CreditLineStatus } from "src/common";

@Injectable()
export class CreditLineService {
    constructor(@InjectRepository(CreditLine) private creditLineRepo: Repository<CreditLine>) {}
    async getCreditLineById(creditLineId: number) {
        return this.creditLineRepo.findOneByOrFail({ id: creditLineId });
    }

    async saveNewCreditLine(newCreditLineDto: CreateCreditLineDto) {
        const newLine = this.creditLineRepo.create(newCreditLineDto);
        return this.creditLineRepo.save(newLine);
    }

    async accrueInterestById(
        creditLineId: number,
        interestAmount: bigint,
        accruedAt: Date
    ): Promise<CreditLine> {
        await this.creditLineRepo
            .createQueryBuilder()
            .update(CreditLine)
            .set({ debtAmount: () => `debtAmount + ${interestAmount}` })
            .set({ accruedAt: accruedAt })
            .where("id = :id", { id: creditLineId })
            .execute();

        return await this.getCreditLinesByIdAllSettingsExtended(creditLineId);
    }

    async increaseDebtAmountById(creditLineId: number, addAmount: bigint): Promise<CreditLine> {
        await this.creditLineRepo
            .createQueryBuilder()
            .update(CreditLine)
            .set({ debtAmount: () => `debtAmount + ${addAmount}` })
            .where("id = :id", { id: creditLineId })
            .execute();

        return await this.getCreditLineById(creditLineId);
    }

    async increaseAccumulatedFeeAmountById(
        creditLineId: number,
        addAmount: bigint
    ): Promise<CreditLine> {
        await this.creditLineRepo
            .createQueryBuilder()
            .update(CreditLine)
            .set({ feeAccumulatedFiatAmount: () => `feeAccumulatedFiatAmount + ${addAmount}` })
            .where("id = :id", { id: creditLineId })
            .execute();

        return this.getCreditLineById(creditLineId);
    }

    // if addFeeAccumulatedAmount === undefined, then addFeeAccumulatedAmount = addDebtAmount
    async increaseDebtAmountAndFeeAccumulatedById(
        creditLineId: number,
        addDebtAmount: bigint,
        addFeeAccumulatedAmount: bigint
    ): Promise<UpdateResult> {
        return this.creditLineRepo
            .createQueryBuilder()
            .update()
            .set({
                debtAmount: () => `debtAmount + ${addDebtAmount}`,
                feeAccumulatedFiatAmount: () => `feeAccumulatedFiatAmount + ${addFeeAccumulatedAmount}`,
            })
            .where("id = :creditLineId", { creditLineId })
            .execute();
    }

    async decreaseDebtAmountById(creditLineId: number, subAmount: bigint) {
        await this.creditLineRepo
            .createQueryBuilder()
            .update(CreditLine)
            .set({ debtAmount: () => `debtAmount - ${subAmount}` })
            .where("id = :id", { id: creditLineId })
            .execute();

        return this.getCreditLineById(creditLineId);
    }

    async updateDepositAmountById(creditLineId: number, newSupplyAmount: bigint) {
        return this.creditLineRepo
            .createQueryBuilder()
            .update()
            .set({ rawDepositAmount: newSupplyAmount })
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

    async getCreditLinesByChatIdCurrencyExtended(chatId: number): Promise<CreditLine[]> {
        return await this.creditLineRepo
            .createQueryBuilder("creditLine")
            .leftJoinAndSelect("creditLine.collateralCurrency", "collateralCurrency")
            .leftJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .leftJoin("creditLine.user", "user")
            .where("user.chatId = :chatId", { chatId })
            .getMany();
    }

    async getCreditLinesByIdAllSettingsExtended(creditLineId: number): Promise<CreditLine> {
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

    async getAllActiveCreditLinesAllSettingsExtended(): Promise<CreditLine[] | null> {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .innerJoinAndSelect("creditLine.collateralCurrency", "collateralCurrency")
            .innerJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .innerJoinAndSelect("creditLine.user", "user")
            .innerJoinAndSelect("creditLine.economicalParameters", "economicalParameters")
            .innerJoinAndSelect("creditLine.userPaymentRequisite", "userPaymentRequisite")
            .where("creditLine.creditLineStatus != :creditLineStatus", {
                creditLineStatus: CreditLineStatus.CLOSED,
            })
            .getMany();
    }
}
