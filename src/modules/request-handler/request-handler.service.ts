import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { BorrowRequest, DepositRequest, RepayRequest, WithdrawRequest } from "../../database/entities";
import { Repository } from "typeorm";
import {
    CreateBorrowRequestHandlerDto,
    CreateDepositRequestHandlerDto,
    CreateRepayRequestHandlerDto,
    CreateWithdrawRequestHandlerDto,
} from "./dto/create-request-handler.dto";
import {
    BorrowRequestStatus,
    DepositRequestStatus,
    RepayRequestStatus,
    WithdrawRequestStatus,
} from "../../common";

@Injectable()
export class RequestHandlerService {
    constructor(
        @InjectRepository(DepositRequest) private depositRequestRepo: Repository<DepositRequest>,
        @InjectRepository(WithdrawRequest) private withdrawRequestRepo: Repository<WithdrawRequest>,
        @InjectRepository(BorrowRequest) private borrowRequestRepo: Repository<BorrowRequest>,
        @InjectRepository(RepayRequest) private repayRequestRepo: Repository<RepayRequest>
    ) {}

    // DepositRequest block

    async getDepositRequest(reqId: number) {
        return this.depositRequestRepo.findOneByOrFail({ id: reqId });
    }

    async saveNewDepositRequest(dto: CreateDepositRequestHandlerDto) {
        const newReq = this.depositRequestRepo.create(dto);
        return this.depositRequestRepo.save(newReq);
    }

    async getAllDepositReqByLineId(creditLineId: number) {
        return this.depositRequestRepo.findAndCount({ where: { creditLineId } });
    }

    async getOldestPendingDepositReq(creditLineId: number) {
        return this.depositRequestRepo
            .createQueryBuilder("dr")
            .where("dr.creditLineId = :creditLineId", { creditLineId })
            .andWhere("dr.depositRequestStatus = :status", {
                status: DepositRequestStatus.PENDING,
            })
            .orderBy("dr.createdAt", "ASC")
            .getOne();
    }

    async updateDepositReqStatus(request: DepositRequest, newStatus: DepositRequestStatus) {
        request.depositRequestStatus = newStatus;
        return this.depositRequestRepo.save(request);
    }

    // WithdrawRequest block

    async getWithdrawRequest(reqId: number) {
        return this.withdrawRequestRepo.findOneByOrFail({ id: reqId });
    }

    async saveNewWithdrawRequest(dto: CreateWithdrawRequestHandlerDto) {
        const newReq = this.withdrawRequestRepo.create(dto);
        return this.withdrawRequestRepo.save(newReq);
    }

    async getAllWithdrawReqByLineId(creditLineId: number) {
        return this.withdrawRequestRepo.findOne({ where: { creditLineId } });
    }

    async getOldestPendingWithdrawReq(creditLineId: number) {
        return this.withdrawRequestRepo
            .createQueryBuilder("wr")
            .where("wr.creditLineId = :creditLineId", { creditLineId })
            .andWhere("wr.withdrawRequestStatus = :status", { status: WithdrawRequestStatus.PENDING })
            .orderBy("wr.createdAt", "ASC")
            .getOneOrFail();
    }

    async updateWithdrawReqStatus(request: WithdrawRequest, newStatus: WithdrawRequestStatus) {
        request.withdrawRequestStatus = newStatus;
        return this.withdrawRequestRepo.save(request);
    }

    // BorrowRequest block

    async getBorrowRequest(reqId: number) {
        return this.borrowRequestRepo.findOneByOrFail({ id: reqId });
    }

    async getFullyAssociatedBorrowRequest(borrowRequestId: number): Promise<BorrowRequest> {
        return this.borrowRequestRepo
            .createQueryBuilder("br")
            .leftJoinAndSelect("br.creditLine", "cl")
            .leftJoinAndSelect("cl.collateralCurrency", "cc")
            .leftJoinAndSelect("cl.debtCurrency", "dc")
            .leftJoinAndSelect("cl.userPaymentRequisite", "upr")
            .leftJoinAndSelect("cl.user", "user")
            .leftJoinAndSelect("br.fiatTransactions", "ftx")
            .where("br.id = :borrowRequestId", { borrowRequestId })
            .getOneOrFail();
    }

    async saveNewBorrowRequest(dto: CreateBorrowRequestHandlerDto) {
        if (!dto.borrowFiatAmount && !dto.initialRiskStrategy) {
            throw new Error("Borrow amount or risk strategy must be provided");
        }
        const newReq = this.borrowRequestRepo.create(dto);
        return this.borrowRequestRepo.save(newReq);
    }

    async getAllBorrowReqByLineId(creditLineId: number) {
        return this.borrowRequestRepo.find({ where: { creditLineId } });
    }

    async getOldestPendingBorrowReq(creditLineId: number) {
        return this.borrowRequestRepo
            .createQueryBuilder("br")
            .where("br.creditLineId = :creditLineId", { creditLineId })
            .andWhere("br.borrowRequestStatus = :status", {
                status: BorrowRequestStatus.VERIFICATION_PENDING,
            })
            .orderBy("br.createdAt", "ASC")
            .getOne();
    }

    async getOldestUnfinalizedBorrowReq(creditLineId: number) {
        return this.borrowRequestRepo
            .createQueryBuilder("br")
            .where("br.borrowRequestStatus != :statusRej", {
                statusRej: BorrowRequestStatus.REJECTED,
            })
            .andWhere("br.borrowRequestStatus != :statusFin", {
                statusFin: BorrowRequestStatus.FINISHED,
            })
            .andWhere("br.creditLineId = :creditLineId", { creditLineId })
            .orderBy("br.createdAt", "ASC")
            .getOne();
    }

    async updateBorrowReqStatus(request: BorrowRequest, newStatus: BorrowRequestStatus) {
        request.borrowRequestStatus = newStatus;
        return this.borrowRequestRepo.save(request);
    }

    // RepayRequest block

    async getFullyAssociatedRepayRequest(repayRequestId: number): Promise<RepayRequest> {
        return this.repayRequestRepo
            .createQueryBuilder("rr")
            .leftJoinAndSelect("rr.creditLine", "cl")
            .leftJoinAndSelect("rr.businessPaymentRequisite", "brp")
            .leftJoinAndSelect("cl.collateralCurrency", "cc")
            .leftJoinAndSelect("cl.debtCurrency", "dc")
            .where("rr.id = :repayRequestId", { repayRequestId })
            .getOneOrFail();
    }

    async saveNewRepayRequest(dto: CreateRepayRequestHandlerDto) {
        const newReq = this.repayRequestRepo.create(dto);
        return this.repayRequestRepo.save(newReq);
    }

    async getAllRepayReqByLineId(creditLineId: number) {
        return this.repayRequestRepo.findAndCount({ where: { creditLineId } });
    }

    async getOldestPendingRepayReq(creditLineId: number) {
        return this.repayRequestRepo
            .createQueryBuilder("rr")
            .where("rr.creditLineId = :creditLineId", { creditLineId })
            .andWhere("rr.repayRequestStatus = :status", {
                status: RepayRequestStatus.VERIFICATION_PENDING,
            })
            .orderBy("rr.createdAt", "ASC")
            .getOne();
    }

    async updateRepayReqStatus(request: RepayRequest, newStatus: RepayRequestStatus) {
        request.repayRequestStatus = newStatus;
        return this.repayRequestRepo.save(request);
    }
}
