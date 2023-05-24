import { Module } from "@nestjs/common";
import { RequestResolverService } from "./request-resolver.service";
import { RequestResolverController } from "./request-resolver.controller";
import { TransactionModule } from "../transaction/transaction.module";
import { RequestHandlerModule } from "../request-handler/request-handler.module";
import { CreditLineModule } from "../credit-line/credit-line.module";
import { RiskEngineModule } from "../risk-engine/risk-engine.module";
import { CurrencyModule } from "../currency/currency.module";

@Module({
    imports: [
        TransactionModule,
        RequestHandlerModule,
        CreditLineModule,
        RiskEngineModule,
        CurrencyModule,
    ],
    controllers: [RequestResolverController],
    providers: [RequestResolverService],
    exports: [RequestResolverService],
})
export class RequestResolverModule {}
