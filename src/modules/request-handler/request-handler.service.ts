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
        return this.depositRequestRepo.findOne({
            where: { creditLineId, depositRequestStatus: DepositRequestStatus.PENDING },
            order: {
                createdAt: "ASC",
            },
        });
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
        return this.withdrawRequestRepo.findOneOrFail({
            where: { creditLineId, withdrawRequestStatus: WithdrawRequestStatus.PENDING },
            order: {
                createdAt: "ASC",
            },
        });
    }

    async updateWithdrawReqStatus(request: WithdrawRequest, newStatus: WithdrawRequestStatus) {
        request.withdrawRequestStatus = newStatus;
        return this.withdrawRequestRepo.save(request);
    }

    // BorrowRequest block

    async getBorrowRequest(reqId: number) {
        return this.borrowRequestRepo.findOneByOrFail({ id: reqId });
    }

    async saveNewBorrowRequest(dto: CreateBorrowRequestHandlerDto) {
        const newReq = this.borrowRequestRepo.create(dto);
        return this.borrowRequestRepo.save(newReq);
    }

    async getAllBorrowReqByLineId(creditLineId: number) {
        return this.borrowRequestRepo.find({ where: { creditLineId } });
    }

    async getOldestPendingBorrowReq(creditLineId: number) {
        return this.borrowRequestRepo.findOne({
            where: { creditLineId, borrowRequestStatus: BorrowRequestStatus.VERIFICATION_PENDING },
            order: {
                createdAt: "ASC",
            },
        });
    }

    async updateBorrowReqStatus(reqId: number, newStatus: BorrowRequestStatus) {
        const req = await this.borrowRequestRepo.findOneByOrFail({ id: reqId });
        req.borrowRequestStatus = newStatus;

        return this.borrowRequestRepo.save(req);
    }

    // RepayRequest block

    async getRepayRequest(reqId: number) {
        return this.repayRequestRepo.findOneByOrFail({ id: reqId });
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

    async updateRepayReqStatus(reqId: number, newStatus: RepayRequestStatus) {
        const req = await this.repayRequestRepo.findOneByOrFail({ id: reqId });
        req.repayRequestStatus = newStatus;

        return this.repayRequestRepo.save(req);
    }
}
