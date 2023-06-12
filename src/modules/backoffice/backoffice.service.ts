import { Injectable } from "@nestjs/common";
import { CreditLineStatus, Role } from "../../common";
import { CollateralCurrency, CreditLine, Operator, User } from "src/database/entities";
import { FindOptionsOrder, Like, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { PAGE_LIMIT } from "src/common/constants";

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
        @InjectRepository(CreditLine)
        private collateralCurrency: Repository<CollateralCurrency>
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

    getAllCustomers() {
        return this.userRepo.count();
    }

    getFeeAccumulatedAmount() {
        return this.creditLineRepo
            .createQueryBuilder("cl")
            .select("SUM(cl.feeAccumulatedFiatAmount)", "sum")
            .getRawOne();
    }

    getBorrow() {
        return this.creditLineRepo
            .createQueryBuilder("creditLines")
            .leftJoinAndSelect("creditLines.debtCurrencyId", "borrowRequest")
            .getMany();
    }

    getDeposit() {
        return this.creditLineRepo
            .createQueryBuilder("creditLines")
            .leftJoinAndSelect("creditLines.collateralCurrencyId", "deptCurrenty")
            .getMany();
    }
    getCollateralCurrency() {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .select("collateralCurrency.id", "id")
            .addSelect("collateralCurrency.decimals", "decimals")
            .addSelect("collateralCurrency.symbol", "symbol")
            .addSelect("SUM(creditLine.rawCollateralAmount)", "amount")
            .leftJoin("creditLine.collateralCurrencyId", "collateralCurrency")
            .groupBy("collateralCurrency.id")
            .getRawMany();
    }

    getDebtCurrency() {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .select("debtCurrency.id", "id")
            .addSelect("debtCurrency.decimals", "decimals")
            .addSelect("debtCurrency.symbol", "symbol")
            .addSelect("SUM(creditLine.debtAmount)", "amount")
            .leftJoin("creditLine.debtCurrencyId", "debtCurrency")
            .groupBy("debtCurrency.id")
            .getRawMany();
    }
}
