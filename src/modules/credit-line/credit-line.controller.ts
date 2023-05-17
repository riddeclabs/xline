import { Controller, Get, Param } from "@nestjs/common";
import { CreditLineService } from "./credit-line.service";
import { ApiTags } from "@nestjs/swagger";
import { CreditLine } from "../../database/entities";

@ApiTags("Credit line")
@Controller("credit-line")
export class CreditLineController {
    constructor(private readonly creditLineService: CreditLineService) {}
    @Get()
    async getAllCreditLines() {
        const allCreditLines = await this.creditLineService.getAllCreditLines();

        return allCreditLines.map(cl => {
            return this.serializeEntity(cl);
        });
    }

    @Get(":id")
    async getCreditLineById(@Param("id") id: string) {
        const cl = await this.creditLineService.getCreditLineById(+id);

        return this.serializeEntity(cl);
    }
    @Get("chatId/:chatId")
    async getCreditLineByChatId(@Param("chatId") chatId: string) {
        const cl = await this.creditLineService.getCreditLineByChatId(+chatId);
        return this.serializeEntity(cl);
    }

    serializeEntity(cl: CreditLine) {
        return {
            ...cl,
            rawCollateralAmount: cl.rawCollateralAmount.toString(),
            debtAmount: cl.debtAmount.toString(),
            feeAccumulatedFiatAmount: cl.feeAccumulatedFiatAmount.toString(),
            healthyFactor: cl.healthyFactor.toString(),
        };
    }
}
