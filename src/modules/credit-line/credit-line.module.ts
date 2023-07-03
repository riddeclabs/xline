import { Module } from "@nestjs/common";
import { CreditLineService } from "./credit-line.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditLine } from "../../database/entities";

@Module({
    imports: [TypeOrmModule.forFeature([CreditLine])],
    providers: [CreditLineService],
    exports: [CreditLineService],
})
export class CreditLineModule {}
