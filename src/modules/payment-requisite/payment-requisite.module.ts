import { Module } from "@nestjs/common";
import { PaymentRequisiteService } from "./payment-requisite.service";
import { PaymentRequisiteController } from "./payment-requisite.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BuisinessPaymentRequisite, UserPaymentRequisite } from "../../database/entities";

@Module({
    imports: [TypeOrmModule.forFeature([UserPaymentRequisite, BuisinessPaymentRequisite])],
    controllers: [PaymentRequisiteController],
    providers: [PaymentRequisiteService],
    exports: [PaymentRequisiteService],
})
export class PaymentRequisiteModule {}
