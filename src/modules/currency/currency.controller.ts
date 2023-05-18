import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from "@nestjs/common";
import { CurrencyService } from "./currency.service";
import { ApiTags } from "@nestjs/swagger";
import { CreateCurrencyDto } from "./dto/create-currency.dto";

@ApiTags("Currency")
@Controller("currency")
export class CurrencyController {
    constructor(private readonly currencyService: CurrencyService) {}

    @Post("collateral")
    @UsePipes(ValidationPipe)
    createCollateralCurrency(@Body() dto: CreateCurrencyDto) {
        return this.currencyService.createCollateralCurrency(dto);
    }

    @Get("collateral")
    getAllCollateralCurrency() {
        return this.currencyService.getAllCollateralCurrency();
    }

    @Get("collateral/:collateralCurrencyId")
    getCollateralCurrencyById(@Param("collateralCurrencyId") id: string) {
        return this.currencyService.getCollateralCurrency(+id);
    }

    @Post("debt")
    @UsePipes(ValidationPipe)
    createDebtCurrency(@Body() dto: CreateCurrencyDto) {
        return this.currencyService.createDebtCurrency(dto);
    }

    @Get("debt")
    getAllBorrowCurrency() {
        return this.currencyService.getAllDebtCurrency();
    }

    @Get("debt/:debtCurrencyId")
    getBorrowCurrencyById(@Param("debtCurrencyId") id: string) {
        return this.currencyService.getDebtCurrency(+id);
    }
}
