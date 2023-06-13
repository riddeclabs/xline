import { Injectable } from "@nestjs/common";
import { CreditLineStatus, Role } from "../../common";
import { BorrowRequest, Operator, RepayRequest, User } from "src/database/entities";
import { FindOptionsOrder, Like, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { PAGE_LIMIT, PAGE_LIMIT_REQUEST } from "src/common/constants";

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
        @InjectRepository(BorrowRequest)
        private borrowRepo: Repository<BorrowRequest>,
        @InjectRepository(RepayRequest)
        private repayRepo: Repository<RepayRequest>
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

    getAllBorrowRequest(page: number) {
        return this.borrowRepo
            .createQueryBuilder("borrow")
            .leftJoinAndSelect("borrow.creditLineId", "creditLine")
            .leftJoinAndSelect("creditLine.collateralCurrencyId", "collateralCurrency")
            .leftJoinAndSelect("creditLine.userPaymentRequisiteId", "userPaymentRequisite")
            .leftJoinAndSelect("creditLine.userId", "user")
            .select(["borrow"])
            .addSelect(["collateralCurrency.symbol"])
            .addSelect(["userPaymentRequisite.iban"])
            .addSelect(["user.chatId"])
            .skip(page * PAGE_LIMIT_REQUEST)
            .take(2)
            .getRawMany();
    }

    getBorrowCount() {
        return this.borrowRepo.createQueryBuilder().getCount();
    }

    getBorrowById(id: string) {
        return this.borrowRepo.findOneBy({
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            where: {
                id: id,
            },
        });
    }

    getAllRepayRequest(page: number) {
        return this.repayRepo
            .createQueryBuilder("repay")
            .leftJoinAndSelect("repay.creditLineId", "creditLine")
            .leftJoinAndSelect("creditLine.collateralCurrencyId", "collateralCurrency")
            .leftJoinAndSelect("creditLine.userPaymentRequisiteId", "userPaymentRequisite")
            .leftJoinAndSelect("creditLine.userId", "user")
            .select(["repay"])
            .addSelect(["collateralCurrency.symbol"])
            .addSelect(["userPaymentRequisite.iban"])
            .addSelect(["user.chatId"])
            .skip(page * PAGE_LIMIT_REQUEST)
            .take(2)
            .getRawMany();
    }

    getRepayCount() {
        return this.repayRepo.createQueryBuilder().getCount();
    }
}
