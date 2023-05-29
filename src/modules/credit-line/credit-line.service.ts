import { Injectable } from "@nestjs/common";
import { CreateCreditLineDto } from "./dto/create-credit-line.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CreditLine } from "../../database/entities";
import { Repository } from "typeorm";

@Injectable()
export class CreditLineService {
    constructor(@InjectRepository(CreditLine) private creditLineRepo: Repository<CreditLine>) {}

    async getCreditLineById(creditLineId: number) {
        return this.creditLineRepo.findOneByOrFail({ id: creditLineId });
    }

    async getCreditLineByChatId(chatId: number) {
        return await this.creditLineRepo
            .createQueryBuilder("creditLine")
            .innerJoinAndSelect("creditLine.userId", "user")
            // Fixme: check chat_id register after merge fresh db scheme
            .where("user.chat_id = :chatId", { chatId })
            .getOneOrFail();
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
            .innerJoin("creditLine.collateralCurrencyId", "cc")
            .where("user.chat_id = :chatId", { chatId })
            .andWhere("cc.symbol = :collateralSymbol", { collateralSymbol })
            .getOneOrFail();
    }
}
