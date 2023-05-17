import { Injectable } from "@nestjs/common";
import {
    CreateBusinessPaymentRequisiteDto,
    CreateUserPaymentRequisiteDto,
} from "./dto/create-payment-requisite.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { BuisinessPaymentRequisite, UserPaymentRequisite } from "../../database/entities";
import { Repository } from "typeorm";

@Injectable()
export class PaymentRequisiteService {
    constructor(
        @InjectRepository(UserPaymentRequisite)
        private userPaymentRepo: Repository<UserPaymentRequisite>,
        @InjectRepository(BuisinessPaymentRequisite)
        private businessPaymentRepo: Repository<BuisinessPaymentRequisite>
    ) {}

    // User requisite handlers

    getAllPayReqByUser(userId: number) {
        return this.userPaymentRepo.findAndCount({
            where: { userId },
        });
    }

    getUserPaymentRequisite(paymentReqId: number) {
        return this.userPaymentRepo.findOne({
            where: { id: paymentReqId },
        });
    }

    saveNewUserRequisite(dto: CreateUserPaymentRequisiteDto) {
        const newReq = this.userPaymentRepo.create(dto);
        return this.userPaymentRepo.save(newReq);
    }

    // Business requisite handlers

    getAllBusinessPayReqs() {
        return this.businessPaymentRepo.findAndCount();
    }

    getBusinessPayReqByCurrency(debtCurrencyId: number) {
        return this.businessPaymentRepo.findOne({
            where: { currencyId: debtCurrencyId },
        });
    }

    saveNewBusinessRequisite(dto: CreateBusinessPaymentRequisiteDto) {
        const newReq = this.businessPaymentRepo.create(dto);
        return this.businessPaymentRepo.save(newReq);
    }
}
