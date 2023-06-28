import { DataSource } from "typeorm";
import { faker } from "@faker-js/faker";
import {
    BorrowRequest,
    BusinessPaymentRequisite,
    CollateralCurrency,
    CreditLine,
    CryptoTransaction,
    DebtCurrency,
    DepositRequest,
    EconomicalParameters,
    FiatTransaction,
    RepayRequest,
    Session,
    User,
    UserPaymentRequisite,
    WithdrawRequest,
} from "../../database/entities";
import {
    BorrowRequestStatus,
    CreditLineStatus,
    DepositRequestStatus,
    FiatTransactionStatus,
    formatUnitsNumber,
    generateReferenceNumber,
    parseUnits,
    RepayRequestStatus,
    WithdrawRequestStatus,
} from "../../common";
import {
    generateChatId,
    generateCurrencySymbol,
    generateRandomBigintInRange,
    generateRandomEthereumAddress,
    generateRandomTransactionHash,
} from "./helper-functions";

export class TestDatabaseSeeder {
    protected dataSource: DataSource;
    protected usedCurrencySymbols: string[] = [];
    protected usedChatIds: number[] = [];

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
    }

    async makeCreditLine(params?: Partial<CreditLine>) {
        const cl = new CreditLine();

        if (params?.userId) {
            cl.userId = params?.userId;
        } else {
            const user = await this.makeUser();
            cl.userId = user.id;
            cl.user = user;
        }

        if (params?.debtCurrencyId) {
            cl.debtCurrencyId = params?.debtCurrencyId;
        } else if (params?.debtCurrency) {
            cl.debtCurrency = params?.debtCurrency;
        } else {
            const dc = await this.makeDebtCurrency();
            cl.debtCurrencyId = dc.id;
            cl.debtCurrency = dc;
        }

        if (params?.collateralCurrencyId) {
            cl.collateralCurrencyId = params?.collateralCurrencyId;
        } else if (params?.collateralCurrency) {
            cl.collateralCurrency = params?.collateralCurrency;
        } else {
            const cc = await this.makeCollateralCurrency();
            cl.collateralCurrencyId = cc.id;
            cl.collateralCurrency = cc;
        }

        if (params?.userPaymentRequisiteId) {
            cl.userPaymentRequisiteId = params?.userPaymentRequisiteId;
        } else if (params?.userPaymentRequisite) {
            cl.userPaymentRequisite = params?.userPaymentRequisite;
        } else {
            const upr = await this.makeUserPaymentRequisite({
                userId: cl.userId ?? cl.user.id,
                debtCurrencyId: cl.debtCurrencyId ?? cl.debtCurrency.id,
            });

            cl.userPaymentRequisiteId = upr.id;
            cl.userPaymentRequisite = upr;
        }

        if (params?.economicalParametersId) {
            cl.economicalParametersId = params?.economicalParametersId;
        } else if (params?.economicalParameters) {
            cl.economicalParameters = params?.economicalParameters;
        } else {
            const ep = await this.makeEconomicalParameters({
                collateralCurrencyId: cl.collateralCurrencyId ?? cl.collateralCurrency.id,
                debtCurrencyId: cl.debtCurrencyId ?? cl.debtCurrency.id,
            });
            cl.economicalParametersId = ep.id;
            cl.economicalParameters = ep;
        }

        cl.withdrawRequests = params?.withdrawRequests ?? [];
        cl.depositRequests = params?.depositRequests ?? [];
        cl.borrowRequests = params?.borrowRequests ?? [];
        cl.repayRequests = params?.repayRequests ?? [];
        cl.gatewayUserId = params?.gatewayUserId ?? "MOCKED_USER_ID";
        cl.creditLineStatus = params?.creditLineStatus ?? CreditLineStatus.INITIALIZED;
        cl.rawCollateralAmount = params?.rawCollateralAmount ?? 0n;
        cl.debtAmount = params?.debtAmount ?? 0n;
        cl.feeAccumulatedFiatAmount = params?.feeAccumulatedFiatAmount ?? 0n;
        cl.healthyFactor = params?.healthyFactor ?? 0n;
        cl.isLiquidated = params?.isLiquidated ?? false;
        cl.refNumber = params?.refNumber ?? generateReferenceNumber();

        return this.dataSource.getRepository(CreditLine).save(cl);
    }

    async makeBusinessPaymentRequisite(opts?: Partial<BusinessPaymentRequisite>) {
        const bpr = new BusinessPaymentRequisite();

        if (opts?.debtCurrencyId) {
            bpr.debtCurrencyId = opts.debtCurrencyId;
        } else if (opts?.debtCurrency) {
            bpr.debtCurrency = opts.debtCurrency;
        } else {
            const dc = await this.makeDebtCurrency();
            bpr.debtCurrencyId = dc.id;
            bpr.debtCurrency = dc;
        }

        bpr.repayRequests = opts?.repayRequests ?? [];

        bpr.bankName = opts?.bankName ?? faker.finance.accountName();
        bpr.iban = opts?.iban ?? faker.finance.iban();

        return this.dataSource.getRepository(BusinessPaymentRequisite).save(bpr);
    }

    async makeUserPaymentRequisite(opts?: Partial<UserPaymentRequisite>) {
        const pr = new UserPaymentRequisite();

        if (opts?.debtCurrencyId) {
            pr.debtCurrencyId = opts.debtCurrencyId;
        } else if (opts?.debtCurrency) {
            pr.debtCurrency = opts.debtCurrency;
        } else {
            const dc = await this.makeDebtCurrency();
            pr.debtCurrencyId = dc.id;
            pr.debtCurrency = dc;
        }

        if (opts?.userId) {
            pr.userId = opts.userId;
        } else if (opts?.user) {
            pr.user = opts.user;
        } else {
            const user = await this.makeUser();
            pr.userId = user.id;
            pr.user = user;
        }

        pr.creditLines = opts?.creditLines ?? [];
        pr.iban = opts?.iban ?? faker.finance.iban();

        return this.dataSource.getRepository(UserPaymentRequisite).save(pr);
    }

    async makeUser(opts?: Partial<User>) {
        const user = new User();

        user.creditLines = opts?.creditLines ?? [];
        user.userPaymentRequisites = opts?.userPaymentRequisites ?? [];
        user.session = opts?.session ?? new Session();
        user.chatId = opts?.chatId ?? this.getUniqChatId();
        user.name = opts?.name ?? faker.finance.accountName();

        return this.dataSource.getRepository(User).save(user);
    }

    async makeEconomicalParameters(opts?: Partial<EconomicalParameters>) {
        const ep = new EconomicalParameters();

        if (opts?.collateralCurrencyId) {
            ep.collateralCurrencyId = opts.collateralCurrencyId;
        } else if (opts?.collateralCurrency) {
            ep.collateralCurrency = opts.collateralCurrency;
        } else {
            const cc = await this.makeCollateralCurrency();
            ep.collateralCurrencyId = cc.id;
            ep.collateralCurrency = cc;
        }

        if (opts?.debtCurrencyId) {
            ep.debtCurrencyId = opts.debtCurrencyId;
        } else if (opts?.debtCurrency) {
            ep.debtCurrency = opts.debtCurrency;
        } else {
            const dc = await this.makeDebtCurrency();
            ep.debtCurrencyId = dc.id;
            ep.debtCurrency = dc;
        }

        ep.creditLines = opts?.creditLines ?? [];
        ep.apr = opts?.apr ?? generateRandomBigintInRange(0.05, 0.15);
        ep.liquidationFee = opts?.liquidationFee ?? generateRandomBigintInRange(0.05, 0.1);
        ep.collateralFactor = opts?.collateralFactor ?? generateRandomBigintInRange(0.6, 0.95);
        ep.liquidationFactor =
            opts?.liquidationFactor ??
            generateRandomBigintInRange(formatUnitsNumber(ep.collateralFactor), 0.99);
        ep.fiatProcessingFee = opts?.fiatProcessingFee ?? generateRandomBigintInRange(0.001, 0.01);
        ep.cryptoProcessingFee = opts?.cryptoProcessingFee ?? generateRandomBigintInRange(0.001, 0.01);

        return this.dataSource.getRepository(EconomicalParameters).save(ep);
    }

    async makeDebtCurrency(opts?: Partial<DebtCurrency>) {
        const dc = new DebtCurrency();

        dc.creditLines = opts?.creditLines ?? [];
        dc.businessPaymentRequisites = opts?.businessPaymentRequisites ?? [];
        dc.userPaymentRequisites = opts?.userPaymentRequisites ?? [];
        dc.economicalParameters = opts?.economicalParameters ?? [];
        dc.symbol = opts?.symbol ?? this.getUniqCurrencySymbol();
        dc.decimals = opts?.decimals ?? 18;

        return this.dataSource.getRepository(DebtCurrency).save(dc);
    }

    async makeCollateralCurrency(opts?: Partial<CollateralCurrency>) {
        const cc = new CollateralCurrency();

        cc.creditLines = opts?.creditLines ?? [];
        cc.economicalParameters = opts?.economicalParameters ?? [];
        cc.symbol = opts?.symbol ?? this.getUniqCurrencySymbol(3, false);
        cc.decimals = opts?.decimals ?? 18;
        return this.dataSource.getRepository(CollateralCurrency).save(cc);
    }

    async makeRepayRequest(opts?: Partial<RepayRequest>) {
        const rr = new RepayRequest();

        if (opts?.creditLineId) {
            rr.creditLineId = opts.creditLineId;
        } else if (opts?.creditLine) {
            rr.creditLine = opts.creditLine;
        } else {
            const cl = await this.makeCreditLine();
            rr.creditLineId = cl.id;
            rr.creditLine = cl;
        }

        if (opts?.businessPaymentRequisiteId) {
            rr.businessPaymentRequisiteId = opts.businessPaymentRequisiteId;
        } else if (opts?.businessPaymentRequisite) {
            rr.businessPaymentRequisite = opts.businessPaymentRequisite;
        } else {
            // Note! Will not work if only creditLineId was provided.
            // Will generate BPR with random debt currency
            const bpr = await this.makeBusinessPaymentRequisite({
                debtCurrencyId: rr.creditLine.debtCurrencyId,
            });
            rr.businessPaymentRequisiteId = bpr.id;
            rr.businessPaymentRequisite = bpr;
        }

        rr.repayRequestStatus = opts?.repayRequestStatus ?? RepayRequestStatus.VERIFICATION_PENDING;

        return this.dataSource.getRepository(RepayRequest).save(rr);
    }

    async makeBorrowRequest(opts?: Partial<BorrowRequest>) {
        const br = new BorrowRequest();

        if (opts?.creditLineId) {
            br.creditLineId = opts.creditLineId;
        } else if (opts?.creditLine) {
            br.creditLine = opts.creditLine;
        } else {
            const cl = await this.makeCreditLine();
            br.creditLineId = cl.id;
            br.creditLine = cl;
        }

        br.borrowFiatAmount = opts?.borrowFiatAmount ?? 100500n;
        br.initialRiskStrategy = opts?.initialRiskStrategy ?? null;
        br.borrowRequestStatus = opts?.borrowRequestStatus ?? BorrowRequestStatus.VERIFICATION_PENDING;

        if (
            (br.borrowFiatAmount && br.initialRiskStrategy) ||
            (!br.borrowFiatAmount && !br.initialRiskStrategy)
        ) {
            throw new Error("Incorrect data to create a borrow request");
        }

        return this.dataSource.getRepository(BorrowRequest).save(br);
    }

    async makeDepositRequest(opts?: Partial<DepositRequest>) {
        const dr = new DepositRequest();

        if (opts?.creditLineId) {
            dr.creditLineId = opts.creditLineId;
        } else if (opts?.creditLine) {
            dr.creditLine = opts.creditLine;
        } else {
            const cl = await this.makeCreditLine();
            dr.creditLineId = cl.id;
            dr.creditLine = cl;
        }

        dr.depositRequestStatus = opts?.depositRequestStatus ?? DepositRequestStatus.PENDING;

        return this.dataSource.getRepository(DepositRequest).save(dr);
    }

    async makeWithdrawRequest(opts?: Partial<WithdrawRequest>) {
        const wr = new WithdrawRequest();

        if (opts?.creditLineId) {
            wr.creditLineId = opts.creditLineId;
        } else if (opts?.creditLine) {
            wr.creditLine = opts.creditLine;
        } else {
            const cl = await this.makeCreditLine();
            wr.creditLineId = cl.id;
            wr.creditLine = cl;
        }

        wr.walletToWithdraw = opts?.walletToWithdraw ?? generateRandomEthereumAddress();
        wr.withdrawAmount = opts?.withdrawAmount ?? 777n;
        wr.withdrawRequestStatus = opts?.withdrawRequestStatus ?? WithdrawRequestStatus.PENDING;

        return this.dataSource.getRepository(WithdrawRequest).save(wr);
    }

    async makeFiatTransaction(opts?: Partial<FiatTransaction>) {
        const ft = new FiatTransaction();

        // One of the option ( borrowRequest/Id || repayRequest/Id) must be provided
        // Auto generation not provided
        if (opts?.borrowRequestId) {
            ft.borrowRequestId = opts.borrowRequestId;
        } else if (opts?.borrowRequest) {
            ft.borrowRequest = opts.borrowRequest;
        }
        if (opts?.repayRequestId) {
            ft.repayRequestId = opts.repayRequestId;
        } else if (opts?.repayRequest) {
            ft.repayRequest = opts.repayRequest;
        }

        if (!ft.borrowRequestId && !ft.borrowRequest) {
            ft.borrowRequestId = null;
        }
        if (!ft.repayRequestId && !ft.repayRequest) {
            ft.repayRequestId = null;
        }

        ft.ibanFrom = opts?.ibanFrom ?? faker.finance.iban();
        ft.ibanTo = opts?.ibanTo ?? faker.finance.iban();
        ft.nameFrom = opts?.nameFrom ?? faker.finance.accountName();
        ft.nameTo = opts?.nameTo ?? faker.finance.accountName();
        ft.rawTransferAmount = opts?.rawTransferAmount ?? parseUnits("274.158");
        ft.status = opts?.status ?? FiatTransactionStatus.PENDING;

        return this.dataSource.getRepository(FiatTransaction).save(ft);
    }

    async makeCryptoTransaction(opts?: Partial<CryptoTransaction>) {
        const ct = new CryptoTransaction();

        // One of the option ( withdrawRequest/Id || depositRequest/Id) must be provided
        // Auto generation not provided
        if (opts?.withdrawRequestId) {
            ct.withdrawRequestId = opts.withdrawRequestId;
        } else if (opts?.withdrawRequest) {
            ct.withdrawRequest = opts.withdrawRequest;
        }
        if (opts?.depositRequestId) {
            ct.depositRequestId = opts.depositRequestId;
        } else if (opts?.depositRequest) {
            ct.depositRequest = opts.depositRequest;
        }

        if (!ct.withdrawRequestId && !ct.withdrawRequest) {
            ct.withdrawRequestId = null;
        }
        if (!ct.depositRequestId && !ct.depositRequest) {
            ct.depositRequestId = null;
        }

        ct.rawTransferAmount = opts?.rawTransferAmount ?? parseUnits("547.1005");
        ct.usdTransferAmount = opts?.usdTransferAmount ?? parseUnits("999.8888");
        ct.txHash = opts?.txHash ?? generateRandomTransactionHash();
        ct.paymentProcessingTxId = opts?.paymentProcessingTxId ?? faker.string.uuid();

        return this.dataSource.getRepository(CryptoTransaction).save(ct);
    }

    getUniqCurrencySymbol(length = 3, isFiatCurrency = true): string {
        const symbol = generateCurrencySymbol(length, isFiatCurrency);

        if (!this.usedCurrencySymbols.includes(symbol)) {
            this.usedCurrencySymbols.push(symbol);
            return symbol;
        }

        return this.getUniqCurrencySymbol(length, isFiatCurrency);
    }

    getUniqChatId(length = 9): number {
        const chatId = generateChatId(length);

        if (!this.usedChatIds.includes(chatId)) {
            this.usedChatIds.push(chatId);
            return chatId;
        }
        return this.getUniqChatId(length);
    }
}
