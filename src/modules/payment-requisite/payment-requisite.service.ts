import { Injectable } from "@nestjs/common";
import {
    CreateBusinessPaymentRequisiteDto,
    CreateUserPaymentRequisiteDto,
} from "./dto/create-payment-requisite.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { BusinessPaymentRequisite, UserPaymentRequisite } from "../../database/entities";
import { Repository } from "typeorm";

@Injectable()
export class PaymentRequisiteService {
    constructor(
        @InjectRepository(UserPaymentRequisite)
        private userPaymentRepo: Repository<UserPaymentRequisite>,
        @InjectRepository(BusinessPaymentRequisite)
        private businessPaymentRepo: Repository<BusinessPaymentRequisite>
    ) {}

    // User requisite handlers

    getAllPayReqByUser(userId: number) {
        return this.userPaymentRepo.findBy({ userId });
    }

    getUserPaymentRequisite(paymentReqId: number) {
        return this.userPaymentRepo.findOneBy({ id: paymentReqId });
    }

    getUserPaymentRequisiteByChatId(chatId: number) {
        return this.userPaymentRepo
            .createQueryBuilder("pr")
            .leftJoin("pr.user", "user")
            .where("user.chatId = :chatId", { chatId })
            .getOne();
    }

    saveNewUserRequisite(dto: CreateUserPaymentRequisiteDto) {
        const newReq = this.userPaymentRepo.create(dto);
        return this.userPaymentRepo.save(newReq);
    }

    // Business requisite handlers

    getAllBusinessPayReqs(): Promise<[BusinessPaymentRequisite[], number]> {
        return this.businessPaymentRepo.findAndCount();
    }

    getBusinessPayReqByCurrency(debtCurrencyId: number) {
        return this.businessPaymentRepo.findOneBy({ debtCurrencyId });
    }

    getBusinessPayReqByRequestId(repayRequestId: number) {
        return this.businessPaymentRepo
            .createQueryBuilder("bpr")
            .leftJoin("bpr.repayRequests", "rr", "rr.id = :repayRequestId", { repayRequestId })
            .getOneOrFail();
    }

    getFreshBusinessPayReqByDebtSymbol(debtCurrencySymbol: string) {
        return this.businessPaymentRepo
            .createQueryBuilder("bpr")
            .innerJoin("bpr.debtCurrencyId", "debtCurrency")
            .where("debtCurrency.symbol = :debtCurrencySymbol", { debtCurrencySymbol })
            .orderBy("bpr.created_at", "ASC")
            .getOneOrFail();
    }

    saveNewBusinessRequisite(dto: CreateBusinessPaymentRequisiteDto) {
        const newReq = this.businessPaymentRepo.create(dto);
        return this.businessPaymentRepo.save(newReq);
    }

    async getBusinessPayReqWithCurrencyByIban(iban: string): Promise<BusinessPaymentRequisite | null> {
        const formattedIban = iban.replace(/\s/g, "").toUpperCase();
        return this.businessPaymentRepo
            .createQueryBuilder("bpr")
            .leftJoin("bpr.debtCurrencyId", "debtCurrency")
            .where("bpr.iban = :formattedIban", { formattedIban })
            .getOne();
    }
}
