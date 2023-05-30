import { Body, Controller, Get, Param, Post, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import { EconomicalParametersService } from "./economical-parameters.service";
import { ApiTags } from "@nestjs/swagger";
import { formatUnits } from "../../common/fixed-number";
import { EconomicalParameters } from "../../database/entities";
import { CreateEconomicalParameterDto } from "./dto/create-economical-parameter.dto";

@ApiTags("Economical parameters")
@Controller("economical-parameters")
export class EconomicalParametersController {
    constructor(private readonly economicalParametersService: EconomicalParametersService) {}

    @Get(":id")
    async getEconomicalParamsById(@Param("id") id: number) {
        const ep = await this.economicalParametersService.getParamsById(id);
        return this.serializeEntity(ep);
    }

    @Get()
    async getAllEconomicalParams() {
        const allParameters = await this.economicalParametersService.getAllParams();
        return allParameters.map(ep => this.serializeEntity(ep));
    }
    @Post()
    @UsePipes(ValidationPipe)
    async createEconomicalParams(@Body() createParamsDto: CreateEconomicalParameterDto) {
        const entity = await this.economicalParametersService.createEconomicalParams(createParamsDto);
        return this.serializeEntity(entity);
    }

    @Get("credit-line-id/:creditLineId")
    async getEconomicalParamsByLineId(@Param("creditLineId") creditLineId: number) {
        const ep = await this.economicalParametersService.getEconomicalParamsByLineId(creditLineId);
        return this.serializeEntity(ep);
    }

    @Get("/fresh-params/currency")
    async getFreshEconomicalParams(
        @Query("collateralCurrencyId") collateralCurrencyId: string,
        @Query("debtCollateralCurrencyId") debtCollateralCurrencyId: string
    ) {
        const ep = await this.economicalParametersService.getFreshEconomicalParams(
            +collateralCurrencyId,
            +debtCollateralCurrencyId
        );
        return this.serializeEntity(ep);
    }

    serializeEntity(ep: EconomicalParameters) {
        return {
            ...ep,
            collateralCurrencyId: ep.collateralCurrencyId,
            debtCurrencyId: ep.debtCurrencyId,
            apr: formatUnits(ep.apr),
            liquidationFee: formatUnits(ep.liquidationFee),
            collateralFactor: formatUnits(ep.collateralFactor),
            liquidationFactor: formatUnits(ep.liquidationFactor),
            fiatProcessingFee: formatUnits(ep.fiatProcessingFee),
            cryptoProcessingFee: formatUnits(ep.cryptoProcessingFee),
        };
    }
}
