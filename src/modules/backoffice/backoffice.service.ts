import { Injectable } from "@nestjs/common";
import { CreditLineStatus, Role } from "../../common";
import { Operator, User } from "src/database/entities";
import { FindOptionsOrder, Like, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { UserService } from "../user/user.service";

export enum OperatorsListColumns {
    updated = "updated",
    role = "role",
}

export enum CustomersListColumns {
    updated = "updated",
    role = "role",
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
        private userService: UserService,
        @InjectRepository(User)
        private userRepo: Repository<User>
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

    getCustomers() {
        return this.userRepo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.creditLines", "creditLine")
            .where("creditLine.creditLineStatus = :status", { status: CreditLineStatus.INITIALIZED })
            .getMany();
    }
}
