import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EconomicalParameters } from "../../database/entities";
import { Repository } from "typeorm";

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
        return this.economicalParamsRepo.findOneOrFail({
            where: {
                collateralCurrencyId,
                debtCurrencyId,
            },
            order: {
                createdAt: "DESC",
            },
        });
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
}
