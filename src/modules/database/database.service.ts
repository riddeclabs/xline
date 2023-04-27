import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreditLineStateStatus } from "../../common";
import { Currency, ExtendedCreditLineState, PlainCreditLineState } from "../../common/database.type";
import {
    CreditLineState,
    CreditRequest,
    EconomicModel,
    ProcessingSettings,
    RepayRequest,
    WithdrawRequest,
} from "../../database/entities";
import { Repository } from "typeorm";

@Injectable()
export class DatabaseService {
    constructor(
        @InjectRepository(CreditLineState)
        private creditLineStateRepo: Repository<CreditLineState>,
        @InjectRepository(CreditRequest)
        private creditRequestRepo: Repository<CreditRequest>,
        @InjectRepository(EconomicModel)
        private economicModelRepo: Repository<EconomicModel>,
        @InjectRepository(ProcessingSettings)
        private processingSettingsRepo: Repository<ProcessingSettings>,
        @InjectRepository(RepayRequest)
        private repayRequestRepo: Repository<RepayRequest>,
        @InjectRepository(WithdrawRequest)
        private withdrawRequestRepo: Repository<WithdrawRequest>
    ) {}

    async getActiveCreditLines(userId: string, currency?: Currency): Promise<ExtendedCreditLineState[]> {
        let query = this.creditLineStateRepo
            .createQueryBuilder("cls")
            .leftJoinAndSelect("cls.creditRequestPk", "creditRequest")
            .where("cls.creditLineStateStatus =:creditLineStateStatus", {
                creditLineStateStatus: CreditLineStateStatus.ACTIVE,
            })
            .andWhere("creditRequest.userId =:userId", { userId })
            .select([
                "cls.id",
                "cls.creditLineStateStatus",
                "cls.rawCollateralAmount",
                "cls.feeAccumulatedFiat",
                "cls.healthFactor",
                "cls.debtAmountFiat",
                "cls.isLiquidated",
                "cls.createdAt",
                "cls.updatedAt",
                "creditRequest.userId",
                "creditRequest.apr",
                "creditRequest.collateralFactor",
                "creditRequest.liquidationFactor",
                "creditRequest.liquidationFee",
                "creditRequest.collateralCurrency",
            ]);

        if (currency) {
            query = query.where("creditRequest.collateralCurrency =:currency", { currency });
        }
        return query.getRawMany();
    }

    async saveCreditLineState(creditLineState: CreditLineState): Promise<CreditLineState> {
        return this.creditLineStateRepo.save(creditLineState);
    }

    async getCreditLineStateById(id: number): Promise<CreditLineState | null> {
        return this.creditLineStateRepo.findOne({ where: { id } });
    }

    async updateCreditLineState(
        id: number,
        creditLineState: Partial<PlainCreditLineState>
    ): Promise<void> {
        await this.creditLineStateRepo.update(id, creditLineState);
    }

    async saveCreditRequest(creditRequest: CreditRequest): Promise<CreditRequest> {
        return this.creditRequestRepo.save(creditRequest);
    }

    async updateCreditRequest(id: number, creditRequest: Partial<CreditRequest>): Promise<void> {
        await this.creditRequestRepo.update(id, creditRequest);
    }

    async getCreditRequestById(id: number): Promise<CreditRequest | null> {
        return this.creditRequestRepo.findOne({ where: { id } });
    }

    async getUsersCreditRequests(userId: string, currency: Currency): Promise<CreditRequest[] | null> {
        return this.creditRequestRepo
            .createQueryBuilder("cr")
            .where("cr.userId =:userId", { userId })
            .andWhere("cr.collateralCurrency =:currency", { currency })
            .orderBy("cr.createdAt", "DESC")
            .getMany();
    }

    async saveRepayRequest(repayRequest: RepayRequest): Promise<RepayRequest> {
        return this.repayRequestRepo.save(repayRequest);
    }

    async updateRepayRequest(id: number, repayRequest: Partial<RepayRequest>): Promise<void> {
        await this.repayRequestRepo.update(id, repayRequest);
    }

    async getRepayRequestById(id: number): Promise<RepayRequest | null> {
        return this.repayRequestRepo.findOne({ where: { id } });
    }

    async getUsersRepayRequests(userId: string, currency: Currency): Promise<RepayRequest[] | null> {
        return this.repayRequestRepo
            .createQueryBuilder("rr")
            .leftJoin("rr.creditLineStatePk", "cls")
            .leftJoin("cls.creditRequestPk", "cr")
            .where("cr.userId =:userId", { userId })
            .andWhere("cr.collateralCurrency =:currency", { currency })
            .orderBy("rr.createdAt", "DESC")
            .getMany();
    }

    async saveWithdrawRequest(withdrawRequest: WithdrawRequest): Promise<WithdrawRequest> {
        return this.withdrawRequestRepo.save(withdrawRequest);
    }

    async updateWithdrawRequest(id: number, withdrawRequest: Partial<WithdrawRequest>): Promise<void> {
        await this.withdrawRequestRepo.update(id, withdrawRequest);
    }

    async getWithdrawRequestById(id: number): Promise<WithdrawRequest | null> {
        return this.withdrawRequestRepo.findOne({ where: { id } });
    }

    async getUsersWithdrawRequests(
        userId: string,
        currency: Currency
    ): Promise<WithdrawRequest[] | null> {
        return this.withdrawRequestRepo
            .createQueryBuilder("wr")
            .leftJoin("wr.creditRequestPk", "cr")
            .where("cr.userId =:userId", { userId })
            .andWhere("cr.collateralCurrency =:currency", { currency })
            .orderBy("wr.createdAt", "DESC")
            .getMany();
    }
}
