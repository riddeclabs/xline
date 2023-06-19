import { Injectable } from "@nestjs/common";
import { CreditLineStatus, Role } from "../../common";
import { CollateralCurrency, CreditLine, DebtCurrency, Operator, User } from "src/database/entities";
import { FindOptionsOrder, Like, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { PAGE_LIMIT } from "src/common/constants";
import { CollatetalCurrencyType, DebtCurrencyType } from "./backoffice.types";

export enum OperatorsListColumns {
    updated = "updated",
    role = "role",
}

export enum CustomersListColumns {
    name = "DESC",
}

export enum ModifyReserveDirection {
    increase = "increase",
    reduce = "reduce",
}

@Injectable()
export class BackOfficeService {
    constructor(
        @InjectRepository(Operator)
        private operatorRepo: Repository<Operator>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(CreditLine)
        private creditLineRepo: Repository<CreditLine>,
        @InjectRepository(CollateralCurrency)
        private collateralCurrency: Repository<CollateralCurrency>,
        @InjectRepository(DebtCurrency)
        private debtCurrency: Repository<DebtCurrency>
    ) {}

    accountInfo() {
        return {
            name: "Account name",
        };
    }

    getOperators(
        page: {
            skip: number;
            take: number;
        },
        sortColumn = OperatorsListColumns.updated,
        userFilter?: string,
        role?: Role
    ): Promise<[Operator[], number]> {
        const sortOrders: Record<OperatorsListColumns, FindOptionsOrder<Operator>> = {
            updated: { updatedAt: "DESC" },
            role: { role: "ASC" },
        };

        return this.operatorRepo.findAndCount({
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            where: {
                role: role ? role : undefined,
                username: userFilter ? Like(`%${userFilter}%`) : undefined,
            },
            skip: page.skip * page.take,
            take: page.take,
            order: sortOrders[sortColumn],
        });
    }

    getCustomers(page: number, sort?: "ASC" | "DESC", username?: string, chatId?: string) {
        const sortTrim = sort ?? "DESC";

        return this.userRepo
            .createQueryBuilder("user")
            .leftJoinAndSelect(
                "user.creditLines",
                "creditLine",
                "creditLine.creditLineStatus = :status",
                { status: CreditLineStatus.INITIALIZED }
            )
            .where("name ilike  :name", { name: `%${username}%` })
            .andWhere("CAST(user.chat_id AS TEXT) like :chatId", { chatId: `%${chatId}%` })
            .skip(page * PAGE_LIMIT)
            .take(PAGE_LIMIT)
            .orderBy("user.name", sortTrim)
            .getManyAndCount();
    }

    getAllCustomersCount() {
        return this.userRepo.count();
    }

    getFeeAccumulatedAmount(): Promise<{ feeAccumulatedUsd: string } | undefined> {
        return this.creditLineRepo
            .createQueryBuilder("cl")
            .select("SUM(cl.feeAccumulatedFiatAmount)", "feeAccumulatedUsd")
            .getRawOne();
    }

    getBorrow() {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .leftJoinAndSelect("creditLine.debtCurrencyId", "borrowRequest")
            .getMany();
    }

    getDeposit() {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .leftJoinAndSelect("creditLine.collateralCurrencyId", "deptCurrenty")
            .getMany();
    }
    getCollateralCurrency(): Promise<CollatetalCurrencyType[]> {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .select("collateralCurrency.id", "id")
            .addSelect("collateralCurrency.decimals", "decimals")
            .addSelect("collateralCurrency.symbol", "symbol")
            .addSelect("SUM(creditLine.rawCollateralAmount)", "amount")
            .leftJoin("creditLine.collateralCurrency", "collateralCurrency")
            .groupBy("collateralCurrency.id")
            .getRawMany();
    }

    getDebtCurrency(): Promise<DebtCurrencyType[]> {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .select("debtCurrency.id", "id")
            .addSelect("debtCurrency.decimals", "decimals")
            .addSelect("debtCurrency.symbol", "symbol")
            .addSelect("SUM(creditLine.debtAmount)", "amount")
            .leftJoin("creditLine.debtCurrency", "debtCurrency")
            .groupBy("debtCurrency.id")
            .getRawMany();
    }
    getDebtAllSymbol(): Promise<{ debtCurrency_symbol: string }[]> {
        return this.debtCurrency
            .createQueryBuilder("debtCurrency")
            .select("debtCurrency.symbol")
            .getRawMany();
    }

    getCollateralsAllSymbol(): Promise<{ collateralCurrency_symbol: string }[]> {
        return this.collateralCurrency
            .createQueryBuilder("collateralCurrency")
            .select("collateralCurrency.symbol")
            .getRawMany();
    }
}
