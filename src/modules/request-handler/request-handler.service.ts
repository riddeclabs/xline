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

    async getAllDepositReqByLineId(creditLineId: number): Promise<[DepositRequest[], number]> {
        return this.depositRequestRepo
            .createQueryBuilder("dr")
            .where("dr.creditLineId = :creditLineId", { creditLineId })
            .orderBy("dr.createdAt", "DESC")
            .getManyAndCount();
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

    async getNewestDepositReq(creditLineId: number): Promise<DepositRequest | null> {
        return this.depositRequestRepo
            .createQueryBuilder("dr")
            .where("dr.creditLineId = :creditLineId", { creditLineId })
            .orderBy("dr.createdAt", "DESC")
            .getOne();
    }

    async getFullyAssociatedDepositRequest(depositRequestId: number): Promise<DepositRequest> {
        return this.depositRequestRepo
            .createQueryBuilder("dr")
            .leftJoinAndSelect("dr.creditLine", "cl")
            .leftJoinAndSelect("cl.collateralCurrency", "cc")
            .leftJoinAndSelect("cl.debtCurrency", "dc")
            .leftJoinAndSelect("cl.userPaymentRequisite", "upr")
            .leftJoinAndSelect("cl.user", "user")
            .leftJoinAndSelect("dr.cryptoTransactions", "ctx")
            .where("dr.id = :depositRequestId", { depositRequestId })
            .getOneOrFail();
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

    async getAllWithdrawReqByLineId(creditLineId: number): Promise<[WithdrawRequest[], number] | null> {
        return this.withdrawRequestRepo
            .createQueryBuilder("wr")
            .where("wr.creditLineId = :creditLineId", { creditLineId })
            .orderBy("wr.createdAt", "DESC")
            .getManyAndCount();
    }

    async getOldestPendingWithdrawReq(creditLineId: number) {
        return this.withdrawRequestRepo
            .createQueryBuilder("wr")
            .where("wr.creditLineId = :creditLineId", { creditLineId })
            .andWhere("wr.withdrawRequestStatus = :status", { status: WithdrawRequestStatus.PENDING })
            .orderBy("wr.createdAt", "ASC")
            .getOneOrFail();
    }

    async getNewestWithdrawReq(creditLineId: number): Promise<WithdrawRequest | null> {
        return this.withdrawRequestRepo
            .createQueryBuilder("wr")
            .where("wr.creditLineId = :creditLineId", { creditLineId })
            .orderBy("wr.createdAt", "DESC")
            .getOne();
    }

    async getFullyAssociatedWithdrawRequest(withdrawRequestId: number): Promise<WithdrawRequest> {
        return this.withdrawRequestRepo
            .createQueryBuilder("wr")
            .leftJoinAndSelect("wr.creditLine", "cl")
            .leftJoinAndSelect("cl.collateralCurrency", "cc")
            .leftJoinAndSelect("cl.debtCurrency", "dc")
            .leftJoinAndSelect("cl.userPaymentRequisite", "upr")
            .leftJoinAndSelect("cl.user", "user")
            .leftJoinAndSelect("wr.cryptoTransactions", "ctx")
            .where("wr.id = :withdrawRequestId", { withdrawRequestId })
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

    async getAllBorrowReqByLineId(creditLineId: number): Promise<[BorrowRequest[], number] | null> {
        return this.borrowRequestRepo
            .createQueryBuilder("br")
            .where("br.creditLineId = :creditLineId", { creditLineId })
            .orderBy("br.createdAt", "DESC")
            .getManyAndCount();
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
    async getNewestBorrowReq(creditLineId: number): Promise<BorrowRequest | null> {
        return this.borrowRequestRepo
            .createQueryBuilder("br")
            .where("br.creditLineId = :creditLineId", { creditLineId })
            .orderBy("br.createdAt", "DESC")
            .getOne();
    }

    async getOldestPendingOrWFDBorrowReq(creditLineId: number) {
        return this.borrowRequestRepo
            .createQueryBuilder("br")
            .leftJoinAndSelect("br.creditLine", "cl")
            .leftJoinAndSelect("cl.userPaymentRequisite", "upr")
            .leftJoinAndSelect("cl.user", "user")
            .leftJoinAndSelect("cl.collateralCurrency", "cc")
            .leftJoinAndSelect("cl.debtCurrency", "dc")
            .where("br.borrowRequestStatus = :statusVP", {
                statusVP: BorrowRequestStatus.VERIFICATION_PENDING,
            })
            .orWhere("br.borrowRequestStatus = :statusWFD", {
                statusWFD: BorrowRequestStatus.WAITING_FOR_DEPOSIT,
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
            .leftJoinAndSelect("rr.fiatTransactions", "ftx")
            .where("rr.id = :repayRequestId", { repayRequestId })
            .getOneOrFail();
    }

    async saveNewRepayRequest(dto: CreateRepayRequestHandlerDto) {
        const newReq = this.repayRequestRepo.create(dto);
        return this.repayRequestRepo.save(newReq);
    }

    async getAllRepayReqByLineId(creditLineId: number): Promise<[RepayRequest[], number] | null> {
        return this.repayRequestRepo
            .createQueryBuilder("rr")
            .where("rr.creditLineId = :creditLineId", { creditLineId })
            .orderBy("rr.createdAt", "DESC")
            .getManyAndCount();
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
    async getNewestRepayReq(creditLineId: number): Promise<RepayRequest | null> {
        return this.repayRequestRepo
            .createQueryBuilder("rr")
            .where("rr.creditLineId = :creditLineId", { creditLineId })
            .orderBy("rr.createdAt", "DESC")
            .getOne();
    }

    async updateRepayReqStatus(request: RepayRequest, newStatus: RepayRequestStatus) {
        request.repayRequestStatus = newStatus;
        return this.repayRequestRepo.save(request);
    }
}
