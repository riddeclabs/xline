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

    saveNewUserRequisite(dto: CreateUserPaymentRequisiteDto) {
        const newReq = this.userPaymentRepo.create(dto);
        return this.userPaymentRepo.save(newReq);
    }

    // Business requisite handlers

    getAllBusinessPayReqs() {
        return this.businessPaymentRepo.findAndCount();
    }

    getBusinessPayReqByCurrency(debtCurrencyId: number) {
        return this.businessPaymentRepo.findOneBy({ debtCurrencyId });
    }

    saveNewBusinessRequisite(dto: CreateBusinessPaymentRequisiteDto) {
        const newReq = this.businessPaymentRepo.create(dto);
        return this.businessPaymentRepo.save(newReq);
    }
}
