import { Module } from "@nestjs/common";
import { PaymentProcessingService } from "./payment-processing.service";
import { PaymentProcessingController } from "./payment-processing.controller";
import { RequestResolverModule } from "../request-resolver/request-resolver.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentProcessing } from "../../database/entities/payment-processing.entity";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [RequestResolverModule, TypeOrmModule.forFeature([PaymentProcessing]), ConfigModule],
    controllers: [PaymentProcessingController],
    providers: [PaymentProcessingService],
    exports: [PaymentProcessingService],
})
export class PaymentProcessingModule {}
