import { Controller, Get, Param, Query } from "@nestjs/common";
import { CreditLineService } from "./credit-line.service";
import { ApiTags } from "@nestjs/swagger";
import { CreditLine } from "../../database/entities";

@ApiTags("Credit line")
@Controller("credit-line")
export class CreditLineController {
    constructor(private readonly creditLineService: CreditLineService) {}

    @Get("all")
    async getAllCreditLines() {
        const allCreditLines = await this.creditLineService.getAllCreditLines();

        return allCreditLines.map(cl => {
            return this.serializeEntity(cl);
        });
    }

    @Get("one/:id")
    async getCreditLineById(@Param("id") id: string) {
        const cl = await this.creditLineService.getCreditLineById(+id);

        return this.serializeEntity(cl);
    }
    @Get("user")
    async getCreditLineByChatIdAndColSymbol(
        @Query("chatId") chatId: string,
        @Query("colSymbol") colSymbol: string
    ) {
        const cl = await this.creditLineService.getCreditLineByChatIdAndColSymbol(+chatId, colSymbol);
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
