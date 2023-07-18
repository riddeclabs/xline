import { Injectable } from "@nestjs/common";
import { BorrowRequestStatus, CreditLineStatus, RepayRequestStatus, Role } from "../../common";
import {
    BorrowRequest,
    CreditLine,
    Operator,
    DebtCurrency,
    CollateralCurrency,
    RepayRequest,
    User,
    FiatTransaction,
    CryptoTransaction,
    WithdrawRequest,
    DepositRequest,
    BusinessPaymentRequisite,
} from "src/database/entities";
import { Connection, FindOptionsOrder, Like, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { EXP_SCALE, PAGE_LIMIT, PAGE_LIMIT_REQUEST } from "src/common/constants";
import {
    AllRequestByCreditLineType,
    CollatetalCurrencyType,
    DebtCurrencyType,
} from "./backoffice.types";
import { RiskEngineService } from "../risk-engine/risk-engine.service";
import { RequestHandlerService } from "../request-handler/request-handler.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { PriceOracleService } from "../price-oracle/price-oracle.service";

export enum OperatorsListColumns {
    updated = "updated",
    role = "role",
}

export enum CustomersListColumns {
    name = "DESC",
}

export enum BorrowRequestColumns {
    createdAt = "DESC",
    updatedAt = "DESC",
}

export enum ModifyReserveDirection {
    increase = "increase",
    reduce = "reduce",
}

interface CreditLineStateDataRaw {
    depositAmountFiat: bigint;
    collateralAmountFiat: bigint;
    debtAmount: bigint;
    utilizationRate: bigint;
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
        private repayRepo: Repository<RepayRequest>,
        @InjectRepository(CreditLine)
        private creditLineRepo: Repository<CreditLine>,
        @InjectRepository(CollateralCurrency)
        private collateralCurrency: Repository<CollateralCurrency>,
        @InjectRepository(DebtCurrency)
        private debtCurrency: Repository<DebtCurrency>,
        @InjectRepository(FiatTransaction)
        private fiatTransaction: Repository<FiatTransaction>,
        @InjectRepository(CryptoTransaction)
        private cryptoTransaction: Repository<CryptoTransaction>,
        @InjectRepository(WithdrawRequest)
        private withdrawRepo: Repository<WithdrawRequest>,
        @InjectRepository(DepositRequest)
        private depositRepo: Repository<DepositRequest>,
        @InjectRepository(BusinessPaymentRequisite)
        private businessRequisite: Repository<BusinessPaymentRequisite>,
        private connection: Connection,
        private readonly riskEngineService: RiskEngineService,
        private readonly requestHandlerService: RequestHandlerService,
        private readonly creditLineService: CreditLineService,
        private readonly priceOracleService: PriceOracleService
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

    getAllBorrowReqExtCreditLineAndDebtCollCurrency(
        page: number,
        sort?: "ASC" | "DESC",
        chatId?: string
    ) {
        const sortDate = sort ?? "DESC";

        return this.borrowRepo
            .createQueryBuilder("borrow")
            .where("NOT (borrow.borrowRequestStatus IN (:...status))", {
                status: [BorrowRequestStatus.REJECTED, BorrowRequestStatus.FINISHED],
            })
            .leftJoinAndSelect("borrow.creditLine", "creditLine")
            .leftJoinAndSelect("creditLine.collateralCurrency", "collateralCurrency")
            .leftJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .leftJoinAndSelect("creditLine.userPaymentRequisite", "userPaymentRequisite")
            .leftJoinAndSelect("creditLine.user", "user")
            .andWhere("CAST(user.chat_id AS TEXT) like :chatId", { chatId: `%${chatId}%` })
            .skip(page * PAGE_LIMIT_REQUEST)
            .take(PAGE_LIMIT_REQUEST)
            .orderBy("borrow.createdAt", sortDate)
            .addOrderBy("borrow.updatedAt", sortDate)
            .getMany();
    }

    getBorrowCount() {
        return this.borrowRepo
            .createQueryBuilder("borrow")
            .where("NOT (borrow.borrowRequestStatus IN (:...status))", {
                status: [BorrowRequestStatus.REJECTED, BorrowRequestStatus.FINISHED],
            })
            .getCount();
    }

    getAllRepayRequest(page: number, sort?: "ASC" | "DESC", chatId?: string, refNumber?: string) {
        const sortDate = sort ?? "DESC";

        return this.repayRepo
            .createQueryBuilder("repay")
            .leftJoinAndSelect("repay.creditLine", "creditLine")
            .leftJoinAndSelect("repay.businessPaymentRequisite", "businessPaymentRequisite")
            .leftJoinAndSelect("creditLine.collateralCurrency", "collateralCurrency")
            .leftJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .leftJoinAndSelect("creditLine.userPaymentRequisite", "userPaymentRequisite")
            .leftJoinAndSelect("creditLine.user", "user")
            .where("repay.repayRequestStatus = :status", {
                status: RepayRequestStatus.VERIFICATION_PENDING,
            })
            .andWhere("CAST(user.chat_id AS TEXT) like :chatId", { chatId: `%${chatId}%` })
            .andWhere("creditLine.refNumber ilike  :refNumber", { refNumber: `%${refNumber}%` })
            .skip(page * PAGE_LIMIT_REQUEST)
            .take(PAGE_LIMIT_REQUEST)
            .orderBy("repay.createdAt", sortDate)
            .getMany();
    }

    getRepayCount() {
        return this.repayRepo
            .createQueryBuilder("repay")
            .where("repay.repayRequestStatus = :status", {
                status: RepayRequestStatus.VERIFICATION_PENDING,
            })
            .getCount();
    }

    getFullyAssociatedUserById(id: string) {
        return this.userRepo
            .createQueryBuilder("user")
            .where("user.id = :id", { id })
            .leftJoinAndSelect("user.creditLines", "creditLine")
            .leftJoinAndSelect("creditLine.userPaymentRequisite", "userPaymentRequisite")
            .leftJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .leftJoinAndSelect("creditLine.collateralCurrency", "collateralCurrency")
            .orderBy("creditLine.createdAt", "ASC")
            .getOne();
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

    getCollateralCurrency(): Promise<CollatetalCurrencyType[]> {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .leftJoin("creditLine.collateralCurrency", "collateralCurrency")
            .select("collateralCurrency.id", "id")
            .addSelect("collateralCurrency.decimals", "decimals")
            .addSelect("collateralCurrency.symbol", "symbol")
            .addSelect("SUM(creditLine.rawCollateralAmount)", "amount")
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

    getDebtCurrencyById(id: string) {
        return this.debtCurrency
            .createQueryBuilder("debtCurrency")
            .where("debtCurrency.id = :id", { id })
            .getOne();
    }

    getCollateralsAllSymbol(): Promise<{ collateralCurrency_symbol: string }[]> {
        return this.collateralCurrency
            .createQueryBuilder("collateralCurrency")
            .select("collateralCurrency.symbol")
            .getRawMany();
    }

    getFiatTxByBorrowId(
        page: number,
        id: string,
        sortField = "created_at",
        sortDirection: "ASC" | "DESC"
    ) {
        return this.fiatTransaction
            .createQueryBuilder("fiat")
            .where("fiat.borrowRequestId = :id", { id })
            .skip(page * PAGE_LIMIT_REQUEST)
            .take(PAGE_LIMIT_REQUEST)
            .orderBy(`fiat.${sortField}`, sortDirection)
            .getMany();
    }

    getFiatTxByRepayId(
        page: number,
        id: string,
        sortField = "created_at",
        sortDirection: "ASC" | "DESC"
    ) {
        return this.fiatTransaction
            .createQueryBuilder("fiat")
            .where("fiat.repayRequestId = :id", { id })
            .skip(page * PAGE_LIMIT_REQUEST)
            .take(PAGE_LIMIT_REQUEST)
            .orderBy(`fiat.${sortField}`, sortDirection)
            .getMany();
    }

    getRepayReqExtBusinessPaymentReq(requestId: string) {
        return this.repayRepo
            .createQueryBuilder("repay")
            .leftJoinAndSelect("repay.businessPaymentRequisite", "businessPaymentRequisite")
            .where("repay.id = :id", { id: requestId })
            .getOne();
    }

    getBorrowRequestExtendCreditLineAndUserPaymentReq(requestId: string) {
        return this.borrowRepo
            .createQueryBuilder("borrow")
            .leftJoinAndSelect("borrow.creditLine", "creditLine")
            .leftJoinAndSelect("creditLine.userPaymentRequisite", "userPaymentRequisite")
            .where("borrow.id = :id", { id: requestId })
            .getOne();
    }

    getCryptoTxByDepId(
        page: number,
        id: string,
        sortField = "created_at",
        sortDirection: "ASC" | "DESC"
    ) {
        return this.cryptoTransaction
            .createQueryBuilder("crypto")
            .where("crypto.depositRequestId = :id", { id })
            .skip(page * PAGE_LIMIT_REQUEST)
            .take(PAGE_LIMIT_REQUEST)
            .orderBy(`crypto.${sortField}`, sortDirection)
            .getMany();
    }

    getCryptoTxByWithdrawId(
        page: number,
        id: string,
        sortField = "created_at",
        sortDirection: "ASC" | "DESC"
    ) {
        return this.cryptoTransaction
            .createQueryBuilder("crypto")
            .where("crypto.withdrawRequestId = :id", { id })
            .skip(page * PAGE_LIMIT_REQUEST)
            .take(PAGE_LIMIT_REQUEST)
            .orderBy(`crypto.${sortField}`, sortDirection)
            .getMany();
    }

    getRepayRequestById(id: string) {
        return this.repayRepo
            .createQueryBuilder("repay")
            .where("repay.id = :id", { id })
            .leftJoinAndSelect("repay.creditLine", "creditLine")
            .leftJoinAndSelect("creditLine.userPaymentRequisite", "userPaymentRequisite")
            .leftJoinAndSelect("repay.businessPaymentRequisite", "businessPaymentRequisite")
            .getOne();
    }

    getAllRequestByCreditLine(
        page: number,
        id: string,
        sortField = "created_at",
        sortDirection = "ASC"
    ): Promise<AllRequestByCreditLineType[]> {
        const query = `
            (SELECT id, created_at, credit_line_id, updated_at, CAST(withdraw_request_status AS text) AS status, 'Withdraw' as type FROM Withdraw_Request WHERE credit_line_id = ${id})
            UNION ALL
            (SELECT id, created_at, credit_line_id, updated_at, CAST(deposit_request_status AS text) AS status, 'Deposit' as type FROM Deposit_Request WHERE credit_line_id = ${id})
            UNION ALL
            (SELECT id, created_at, credit_line_id, updated_at, CAST(borrow_request_status AS text) AS status, 'Borrow' as type FROM Borrow_Request WHERE credit_line_id = ${id})
            UNION ALL
            (SELECT id, created_at, credit_line_id, updated_at, CAST(repay_request_status AS text) AS status, 'Repay' as type FROM Repay_Request WHERE credit_line_id = ${id})
            ORDER BY ${sortField} ${sortDirection}
            OFFSET ${page * PAGE_LIMIT_REQUEST}
            LIMIT ${PAGE_LIMIT_REQUEST}
        `;
        return this.connection.manager.query(query);
    }

    getCountRequestByCreditLine(id: string): Promise<{ count: string }[]> {
        const query = `
        SELECT COUNT(*) FROM(
            (SELECT id, created_at, credit_Line_Id, updated_at, CAST(withdraw_request_status AS text) AS status, 'Withdraw' as type FROM Withdraw_Request WHERE credit_Line_Id = ${id})
            UNION ALL
            (SELECT id, created_At, credit_Line_Id, updated_at, CAST(deposit_request_status AS text) AS status, 'Deposit' as type FROM Deposit_Request WHERE credit_Line_Id = ${id})
            UNION ALL
            (SELECT id, created_At, credit_Line_Id, updated_at, CAST(borrow_request_status AS text) AS status, 'Borrow' as type FROM Borrow_Request WHERE credit_Line_Id = ${id})
            UNION ALL
            (SELECT id, created_At, credit_Line_Id, updated_at, CAST(repay_request_status AS text) AS status, 'Repay' as type FROM Repay_Request WHERE credit_Line_Id = ${id})
        ) AS combined

        `;
        return this.connection.manager.query(query);
    }

    getCreditLineByIdExtUserInfoAndDebtCollCurrency(id: string) {
        return this.creditLineRepo
            .createQueryBuilder("creditLine")
            .leftJoinAndSelect("creditLine.user", "user")
            .where("creditLine.id = :id", { id })
            .leftJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .leftJoinAndSelect("creditLine.collateralCurrency", "collateralCurrency")
            .getOne();
    }

    getDepositReqStatusById(id: string) {
        return this.depositRepo
            .createQueryBuilder("deposit")
            .where("deposit.id = :id", { id })
            .select(["deposit.depositRequestStatus", "deposit.id"])
            .getOne();
    }

    getRepayStatusById(id: string) {
        return this.repayRepo
            .createQueryBuilder("repay")
            .where("repay.id = :id", { id })
            .select(["repay.repayRequestStatus", "repay.id"])
            .getOne();
    }

    getWithdrawReqById(id: string) {
        return this.withdrawRepo
            .createQueryBuilder("withdraw")
            .where("withdraw.id = :id", { id })
            .getOne();
    }
    getUserInfoByBorrowIdExtCreditLineAndDebtCurrency(id: string) {
        return this.userRepo
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.creditLines", "creditLine")
            .leftJoinAndSelect("user.userPaymentRequisites", "userPaymentRequisites")
            .leftJoinAndSelect("creditLine.debtCurrency", "debtCurrency")
            .leftJoinAndSelect("creditLine.borrowRequests", "borrowRequests")
            .where("borrowRequests.id = :id", { id })
            .getOne();
    }

    getFiatTransactionsByRequestId(id: string) {
        return this.fiatTransaction
            .createQueryBuilder("fiat")
            .where("fiat.borrowRequestId = :id", { id })
            .getOne();
    }

    async getCreditLineStateBeforeAndAfterBorrowResolved(
        creditLineId: number,
        borrowRequestId: number
    ): Promise<{
        stateBefore: CreditLineStateDataRaw;
        stateAfter: CreditLineStateDataRaw;
    }> {
        const creditLine = await this.creditLineService.getCreditLinesByIdAllSettingsExtended(
            creditLineId
        );
        const fiatSupplyAmount = await this.priceOracleService.convertCryptoToUsd(
            creditLine.collateralCurrency.symbol,
            creditLine.collateralCurrency.decimals,
            creditLine.rawCollateralAmount
        );
        const utilizationRate = this.riskEngineService.calculateUtilizationRate(
            fiatSupplyAmount,
            creditLine.debtAmount
        );
        const borrowRequest = await this.requestHandlerService.getBorrowRequest(borrowRequestId);

        if (!borrowRequest.borrowFiatAmount) {
            throw new Error("Borrow amount does not exist");
        }

        const stateBefore: CreditLineStateDataRaw = {
            depositAmountFiat: fiatSupplyAmount,
            collateralAmountFiat:
                (fiatSupplyAmount * creditLine.economicalParameters.collateralFactor) / EXP_SCALE,
            debtAmount: creditLine.debtAmount,
            utilizationRate: utilizationRate,
        };

        const borrowWithFee = await this.riskEngineService.calculateBorrowAmountWithFees(
            creditLine.id,
            borrowRequest.borrowFiatAmount
        );
        const debtAfter = stateBefore.debtAmount + borrowWithFee;

        const stateAfter: CreditLineStateDataRaw = {
            ...stateBefore,
            debtAmount: debtAfter,
            utilizationRate: this.riskEngineService.calculateUtilizationRate(
                fiatSupplyAmount,
                debtAfter
            ),
        };

        return {
            stateBefore,
            stateAfter,
        };
    }

    getBusinesRaymentRequisitesAndDebt(
        page: number,
        sortField = "createdAt",
        sortDirection: "ASC" | "DESC"
    ) {
        return this.businessRequisite
            .createQueryBuilder("biz")
            .leftJoinAndSelect("biz.debtCurrency", "debtCurrency")
            .skip(page * PAGE_LIMIT_REQUEST)
            .take(PAGE_LIMIT_REQUEST)
            .orderBy(
                sortField === "symbol" ? `debtCurrency.${sortField}` : `biz.${sortField}`,
                sortDirection
            )
            .getMany();
    }

    getBusinesRaymentRequisitesCount() {
        return this.businessRequisite.createQueryBuilder("biz").getCount();
    }
}
