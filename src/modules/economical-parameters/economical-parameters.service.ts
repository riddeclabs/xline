import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EconomicalParameters } from "../../database/entities";
import { Repository } from "typeorm";
import { CreateEconomicalParameterDto } from "./dto/create-economical-parameter.dto";
import { parseUnits } from "../../common/fixed-number";

@Injectable()
export class EconomicalParametersService {
    constructor(
        @InjectRepository(EconomicalParameters)
        private economicalParamsRepo: Repository<EconomicalParameters>
    ) {}

    async getFreshEconomicalParams(
        collateralCurrencyId: number,
        debtCurrencyId: number
    ): Promise<EconomicalParameters> {
        return this.economicalParamsRepo
            .createQueryBuilder("ep")
            .where("ep.collateral_currency_id = :collateralId", { collateralId: collateralCurrencyId })
            .andWhere("ep.debt_currency_id = :debtId", { debtId: debtCurrencyId })
            .orderBy("created_at", "DESC")
            .getOneOrFail();
    }

    async getEconomicalParamsByLineId(creditLineId: number): Promise<EconomicalParameters> {
        return this.economicalParamsRepo
            .createQueryBuilder("ep")
            .leftJoin("ep.creditLines", "cl")
            .where("cl.id = :creditLineId", { creditLineId })
            .getOneOrFail();
    }

    async getParamsById(economicalParamsId: number): Promise<EconomicalParameters> {
        return this.economicalParamsRepo.findOneByOrFail({ id: economicalParamsId });
    }

    async getAllParams(): Promise<EconomicalParameters[]> {
        return this.economicalParamsRepo.find();
    }

    async createEconomicalParams(dto: CreateEconomicalParameterDto) {
        const entity = new EconomicalParameters();
        entity.collateralCurrencyId = dto.collateralCurrencyId;
        entity.debtCurrencyId = dto.debtCurrencyId;
        entity.apr = parseUnits(dto.apr);
        entity.liquidationFee = parseUnits(dto.liquidationFee);
        entity.collateralFactor = parseUnits(dto.collateralFactor);
        entity.liquidationFactor = parseUnits(dto.liquidationFactor);
        entity.fiatProcessingFee = parseUnits(dto.fiatProcessingFee);
        entity.cryptoProcessingFee = parseUnits(dto.cryptoProcessingFee);

        return this.economicalParamsRepo.save(entity);
    }
}
