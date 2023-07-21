import {
    Get,
    Controller,
    Render,
    Redirect,
    Post,
    UseGuards,
    Res,
    Req,
    Logger,
    ValidationPipe,
    UsePipes,
    Param,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import { OperatorsListQuery } from "./decorators";
import { Response, Request } from "express";
import {
    bigintToFormattedPercent,
    BorrowRequestStatus,
    createRepayRequestRefNumber,
    DepositRequestStatus,
    formatUnits,
    makePagination,
    RepayRequestStatus,
    Role,
    WithdrawRequestStatus,
} from "src/common";
import { Roles } from "src/decorators/roles.decorator";
import { AuthenticatedGuard } from "src/guards/authenticated.guard";
import { LoginGuard } from "src/guards/login.guard";
import { RoleGuard } from "src/guards/role.guard";
import { OperatorsListDto } from "./dto";
import { BackOfficeService, OperatorsListColumns } from "./backoffice.service";
import { EXP_SCALE, PAGE_LIMIT, PAGE_LIMIT_REQUEST } from "src/common/constants";
import { CustomersListDto } from "./dto/customers.dto";
import { CustomersListQuery } from "./decorators/customers.decorators";
import * as moment from "moment";
import { BorrowRequestDto } from "./dto/borrow-request.dto";
import { PriceOracleService } from "../price-oracle/price-oracle.service";
import { CreditLineDetailsType } from "./backoffice.types";
import { RepayListQuery } from "./decorators/repay-request.decorators";
import { BorrowRequest } from "./decorators/borrow-request.decorators";
import { RepayRequestDto } from "./dto/repay-request.dto";
import { CreditLineDetailsDto } from "./dto/credit-line-details.dto";
import { CreditLineDetails } from "./decorators/credit-line-details.decorators";
import { CryptoTransaction, FiatTransaction } from "src/database/entities";
import { TransactionsQuery } from "./decorators/transactions.decorators";
import { TransactionsDto } from "./dto/transactions.dto";
import { truncateDecimalsToStr } from "src/common/text-formatter";
import { RequestResolverService } from "../request-resolver/request-resolver.service";
import { CreditLineService } from "../credit-line/credit-line.service";
import { RiskEngineService } from "../risk-engine/risk-engine.service";
import { PaymentProcessingService } from "../payment-processing/payment-processing.service";
import { RequestHandlerService } from "../request-handler/request-handler.service";
import { EconomicalParametersService } from "../economical-parameters/economical-parameters.service";
import { BusinessRequisites } from "./decorators/business-requisites.decorators";
import { EconomicalParametersDecorator } from "./decorators/economical.decorators";
import { BusinesRequisitesDto } from "./dto/business-requisites.dto";
import { EconomicalParametersDto } from "./dto/economical.dto";

@Controller("backoffice")
export class BackOfficeController {
    constructor(
        private readonly backofficeService: BackOfficeService,
        private readonly priceOracleService: PriceOracleService,
        private readonly riskEngineService: RiskEngineService,
        private readonly creditLineService: CreditLineService,
        private readonly requestResolverService: RequestResolverService,
        private readonly paymentProcessingService: PaymentProcessingService,
        private readonly requestHandler: RequestHandlerService,
        private readonly economicalParamsService: EconomicalParametersService
    ) {}

    @Get("/auth")
    @Render("backoffice/auth")
    auth(@Req() req: Request) {
        return {
            message: req.flash("loginError"),
        };
    }

    @UseGuards(LoginGuard)
    @Post("/auth")
    postAuth(@Res() res: Response) {
        res.redirect("/backoffice");
    }

    @Post("/logout")
    logout(@Req() req: Request, @Res() res: Response) {
        req.session.destroy(err => {
            if (err) {
                Logger.error(err);
            }
            res.redirect("/backoffice/auth");
        });
    }

    @Get("/error")
    @Render("backoffice/error")
    error(@Req() req: Request) {
        return {
            message: req.flash("error"),
        };
    }

    @UseGuards(AuthenticatedGuard)
    @Get("/")
    @Redirect("backoffice/home")
    root() {
        // some code here
    }

    @UseGuards(AuthenticatedGuard)
    @Get("/404")
    @Render("backoffice/404")
    notFoundPage() {
        // some code here
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("home")
    @Render("backoffice/home")
    async home() {
        const allCustomersLength = await this.backofficeService.getAllCustomersCount();
        const feeAccumulatedUsd = await this.backofficeService.getFeeAccumulatedAmount();
        const collateralInitial = await this.backofficeService.getCollateralCurrency();
        const debtAllSymbol = await this.backofficeService.getDebtAllSymbol();
        const currenciesAllSymbol = await this.backofficeService.getCollateralsAllSymbol();
        const collateralCurrencyAmount = await Promise.all(
            collateralInitial.map(async item => {
                const amountUSD = await this.priceOracleService.convertCryptoToUsd(
                    item.symbol,
                    item.decimals,
                    BigInt(item.amount)
                );
                return {
                    symbol: item.symbol,
                    amount: Math.trunc(+formatUnits(amountUSD)),
                };
            })
        );

        const totalDeposit = collateralCurrencyAmount
            .map(item => item.amount)
            .reduce((a, b) => a + b, 0);

        const debtCurrencyInitial = await this.backofficeService.getDebtCurrency();

        const totalDebt = debtCurrencyInitial.map(item => item.amount).reduce((a, b) => +a + +b, 0);
        return {
            totalCustomers: allCustomersLength,
            totalDeposit,
            collateralCurrencyAmount,
            //TODO must be fixed when new debt currency will be added
            totalDebt: truncateDecimalsToStr(
                formatUnits(BigInt(totalDebt), debtCurrencyInitial[0]?.decimals),
                2,
                false
            ),
            debtCurrencyInitial: debtCurrencyInitial.map(item => {
                return {
                    ...item,
                    //TODO must be fixed when new debt currency will be added
                    amount: truncateDecimalsToStr(
                        formatUnits(BigInt(item.amount || 0n), debtCurrencyInitial[0]?.decimals),
                        2,
                        false
                    ),
                };
            }),
            //TODO must be fixed when new debt currency will be added
            totalFeeAccumulatedUsd: truncateDecimalsToStr(
                formatUnits(
                    BigInt(feeAccumulatedUsd?.feeAccumulatedUsd || 0n),
                    debtCurrencyInitial[0]?.decimals
                ),
                2,
                false
            ),
            currenciesAllSymbol,
            debtAllSymbol,
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("supported")
    @Render("backoffice/supported")
    supported(@Req() req: Request) {
        return {
            account: req.user,
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("economical")
    @Render("backoffice/economical")
    async economical(@EconomicalParametersDecorator() query: EconomicalParametersDto) {
        const { debt, collateral } = query;
        const debtCurrency = await this.backofficeService.getDebtCurrency();
        const collateralCurrency = await this.backofficeService.getCollateralCurrency();
        const debtCurrencyById = await this.backofficeService.getDebtCurrencyById(debt || "1");
        const freshEconomicalParams = await this.economicalParamsService.getFreshEconomicalParams(
            Number(collateral) || 1,
            Number(debt) || 1
        );

        const freshEcoFields = {
            apr: truncateDecimalsToStr(
                formatUnits(freshEconomicalParams.apr, debtCurrencyById?.decimals),
                4,
                false
            ),
            collateralFactor: truncateDecimalsToStr(
                formatUnits(freshEconomicalParams.collateralFactor, debtCurrencyById?.decimals),
                4,
                false
            ),
            liquidationFactor: truncateDecimalsToStr(
                formatUnits(freshEconomicalParams.liquidationFactor, debtCurrencyById?.decimals),
                4,
                false
            ),
            fiatProcessingFee: truncateDecimalsToStr(
                formatUnits(freshEconomicalParams.fiatProcessingFee, debtCurrencyById?.decimals),
                4,
                false
            ),
            cryptoProcessingFee: truncateDecimalsToStr(
                formatUnits(freshEconomicalParams.cryptoProcessingFee, debtCurrencyById?.decimals),
                4,
                false
            ),
            liquidationFee: truncateDecimalsToStr(
                formatUnits(freshEconomicalParams.liquidationFee, debtCurrencyById?.decimals),
                4,
                false
            ),
        };

        return {
            debtCurrency,
            collateralCurrency,
            checkCurrency: !!debt || !!collateral,
            freshEcoFields,
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("xline-requisites")
    @Render("backoffice/xline-requisites")
    async xlineRequisites(@BusinessRequisites() query: BusinesRequisitesDto) {
        const { page, sortField, sortDirection } = query;
        const businessPaymentRequisitesCount =
            await this.backofficeService.getBusinesRaymentRequisitesCount();
        const businessPaymentRequisites =
            await this.backofficeService.getBusinesRaymentRequisitesAndDebt(
                page - 1,
                sortField,
                sortDirection
            );
        const debtCurrency = await this.backofficeService.getDebtCurrency();
        const requisites = businessPaymentRequisites.map(requisit => {
            return {
                currency: requisit.debtCurrency.symbol,
                name: requisit.bankName,
                iban: requisit.iban,
            };
        });
        const queryWithDefaults = {
            page: page > 1 ? page : undefined,
            sortField,
            sortDirection,
        };
        const totalPageCount = Math.ceil(businessPaymentRequisitesCount / PAGE_LIMIT_REQUEST);
        return {
            requisites,
            debtCurrency,
            page: {
                current: page,
                query: queryWithDefaults,
                totalPageCount,
                pages: makePagination({
                    currentPage: page,
                    totalPageCount,
                    siblingCount: 1,
                }),
                disabled: businessPaymentRequisitesCount > PAGE_LIMIT_REQUEST,
            },
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("borrow-request")
    @Render("backoffice/borrow-request")
    async borrowList(@BorrowRequest() query: BorrowRequestDto) {
        const { page, sort, chatId } = query;
        const chatIdFilter = chatId?.trim() ?? "";

        const getAllBorrow =
            await this.backofficeService.getAllBorrowReqExtCreditLineAndDebtCollCurrency(
                page - 1,
                sort,
                chatIdFilter
            );
        const allBorrowResult = getAllBorrow.map(item => {
            return {
                ...item,
                createdAt: moment(item.createdAt).format("DD.MM.YYYY HH:mm"),
                updatedAt: moment(item.updatedAt).format("DD.MM.YYYY HH:mm"),
                borrowFiatAmount: truncateDecimalsToStr(
                    formatUnits(item.borrowFiatAmount ?? 0n, item.creditLine.debtCurrency.decimals),
                    2,
                    false
                ),
            };
        });
        const totalCount = await this.backofficeService.getBorrowCount(chatIdFilter);
        const totalPageCount = Math.ceil(totalCount / PAGE_LIMIT_REQUEST);
        const queryWithDefaults = {
            page: page > 1 ? page : undefined,
            chatId: chatIdFilter ?? undefined,
            sort: sort,
        };
        return {
            allBorrowResult,
            page: {
                current: page,
                query: queryWithDefaults,
                totalPageCount,
                pages: makePagination({
                    currentPage: page,
                    totalPageCount,
                    siblingCount: 1,
                }),
                disabled: totalCount > PAGE_LIMIT_REQUEST,
            },
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("repay-request")
    @Render("backoffice/repay-request")
    async repayList(@RepayListQuery() query: RepayRequestDto) {
        const { page, sort, chatId, refNumber } = query;
        const chatIdFilter = chatId?.trim() ?? "";
        const refNumberFilter = refNumber?.trim() ?? "";

        const getAllRepay = await this.backofficeService.getAllRepayRequest(
            page - 1,
            sort,
            chatIdFilter,
            refNumberFilter
        );

        const allRepayResult = getAllRepay.map(item => {
            return {
                ...item,
                createdAt: moment(item.createdAt).format("DD.MM.YYYY HH:mm"),
                updatedAt: moment(item.updatedAt).format("DD.MM.YYYY HH:mm"),
                xlineIban: item.businessPaymentRequisite.iban,
                refNumber: createRepayRequestRefNumber(item.creditLine.refNumber, item.id),
            };
        });

        const totalCount = await this.backofficeService.getRepayCount(chatIdFilter, refNumberFilter);
        const totalPageCount = Math.ceil(totalCount / PAGE_LIMIT_REQUEST);
        const queryWithDefaults = {
            page: page > 1 ? page : undefined,
            chatId: chatIdFilter ?? undefined,
            refNumber: refNumberFilter ?? undefined,
            sort: sort,
        };
        return {
            allRepayResult,
            page: {
                current: page,
                query: queryWithDefaults,
                totalPageCount,
                pages: makePagination({
                    currentPage: page,
                    totalPageCount,
                    siblingCount: 1,
                }),
                disabled: totalCount > PAGE_LIMIT_REQUEST,
            },
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("borrow-request/:customerId/:creditLineId/:id")
    @Render("backoffice/resolve-borrow-request")
    async borrowRequestResolve(@Param("id") id: string) {
        const borrowRequest = await this.requestHandler.getFullyAssociatedBorrowRequest(+id);

        // Accrue interest to get fresh debt value
        const creditLine = await this.riskEngineService.accrueInterest(borrowRequest.creditLine);

        const { stateAfter, stateBefore } =
            borrowRequest.borrowRequestStatus === BorrowRequestStatus.VERIFICATION_PENDING
                ? await this.backofficeService.getCreditLineStateBeforeAndAfterBorrowResolved(
                      creditLine.id,
                      Number(id)
                  )
                : { stateAfter: {}, stateBefore: {} };

        const checkBorrowReq = await this.requestResolverService.verifyBorrowRequest(Number(id));

        const borrowAmountAndStatus = {
            amount: formatUnits(borrowRequest.borrowFiatAmount ?? 0n),
            status: checkBorrowReq.isVerified,
        };

        const initialFiatTransaction = borrowRequest.fiatTransactions[0] ?? null;
        const fiatTransactions = {
            ...initialFiatTransaction,
            rawTransferAmount: truncateDecimalsToStr(
                formatUnits(initialFiatTransaction?.rawTransferAmount ?? 0n),
                2,
                false
            ),
            symbol: creditLine.debtCurrency.symbol,
        };

        const businessPaymentRequisites = await this.backofficeService.getBusinessPaymentRequisites();

        const resultPageData = {
            accountName: creditLine.user.name,
            iban: creditLine.userPaymentRequisite.iban,
            collateralFactor: bigintToFormattedPercent(creditLine.economicalParameters.collateralFactor),
            liquidationFactor: bigintToFormattedPercent(
                creditLine.economicalParameters.liquidationFactor
            ),
            beforeCollateralAmount: truncateDecimalsToStr(
                formatUnits(stateBefore.collateralAmountFiat ?? 0n, creditLine.debtCurrency.decimals),
                2,
                false
            ),
            beforeDepositAmount: truncateDecimalsToStr(
                formatUnits(stateBefore.depositAmountFiat ?? 0n, creditLine.debtCurrency.decimals),
                2,
                false
            ),
            symbol: creditLine.debtCurrency.symbol.toLowerCase(),
            beforeBorrowAmount: truncateDecimalsToStr(
                formatUnits(stateBefore.debtAmount ?? 0n),
                2,
                false
            ),
            beforeUtilizationFactor: bigintToFormattedPercent(stateBefore.utilizationRate ?? 0n),
            afterBorrowAmount: truncateDecimalsToStr(formatUnits(stateAfter.debtAmount ?? 0n), 2, false),
            afterUtilizationFactor: bigintToFormattedPercent(stateAfter.utilizationRate ?? 0n),
            afterCollateralAmount: truncateDecimalsToStr(
                formatUnits(stateAfter.collateralAmountFiat ?? 0n, creditLine.debtCurrency.decimals),
                2,
                false
            ),
            afterDepositAmount: truncateDecimalsToStr(
                formatUnits(stateAfter.depositAmountFiat ?? 0n, creditLine.debtCurrency.decimals),
                2,
                false
            ),
            status: borrowRequest.borrowRequestStatus,
            fiatTransactions,
            borrowAmountAndStatus,
            ibanList: businessPaymentRequisites.map(item => item.iban),
        };
        return { resultPageData };
    }

    @Get("repay-request/:customerId/:creditLineId/:id")
    @Render("backoffice/repay-request-item")
    async repayItem(@Res() res: Response, @Param("id") id: string) {
        const repayRequestById = await this.backofficeService.getRepayRequestById(id);
        if (!repayRequestById) {
            throw new HttpException("Not found", HttpStatus.NOT_FOUND);
        }
        const resultRepayRequestById = {
            refNumber: createRepayRequestRefNumber(repayRequestById?.creditLine.refNumber || "", +id),
            iban: repayRequestById?.businessPaymentRequisite.iban,
            debtAmountUSD: truncateDecimalsToStr(
                formatUnits(repayRequestById?.creditLine.debtAmount || 0n),
                2,
                false
            ),
        };
        return resultRepayRequestById;
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("customers")
    @Render("backoffice/customers")
    async getCustomers(@Req() req: Request, @CustomersListQuery() query: CustomersListDto) {
        const { page, username, sort, chatId } = query;
        const chatIdFilter = chatId?.trim() ?? "";
        const userFilter = username?.trim() ?? "";

        const [initialCustomers, totalCount] = await this.backofficeService.getCustomers(
            page - 1,
            sort,
            userFilter,
            chatIdFilter
        );
        const customersWithActiveLines = initialCustomers.map(customer => {
            return {
                id: customer.id,
                chatId: customer.chatId,
                name: customer.name,
                activeLines: customer.creditLines.length,
            };
        });

        const queryWithDefaults = {
            page: page > 1 ? page : undefined,
            username: userFilter ?? undefined,
            chatId: chatIdFilter ?? undefined,
            sort: sort,
        };
        const totalPageCount = Math.ceil(totalCount / PAGE_LIMIT);
        return {
            customers: customersWithActiveLines,
            page: {
                current: page,
                query: queryWithDefaults,
                totalPageCount,
                pages: makePagination({
                    currentPage: page,
                    totalPageCount,
                    siblingCount: 1,
                }),
                disabled: totalCount > PAGE_LIMIT,
            },
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("customers/credit-line-detail/:type/:customerId/:creditLineId/:id")
    @Render("backoffice/credit-line-detail")
    async creditLineDetails(
        @Res() res: Response,
        @Param("id") id: string,
        @Param("customerId") customerId: string,
        @Param("creditLineId") creditLineId: string,
        @Param("type") type: string,
        @CreditLineDetails() query: CreditLineDetailsDto
    ) {
        const { page, sortField, sortDirection } = query;
        const generalUserInfoByCreditLineId =
            await this.backofficeService.getCreditLineByIdExtUserInfoAndDebtCollCurrency(creditLineId);
        if (!generalUserInfoByCreditLineId) {
            throw new HttpException("Not found", HttpStatus.NOT_FOUND);
        }
        let initialRiskStrategy = "";
        let resultTable: FiatTransaction[] | CryptoTransaction[] = [];
        let status = { id: 0, status: "", wallet: "" };
        let associatedXLineInfo = { bankName: "", iban: "" };
        let borrowIban = "";
        let checkBorrowFiatAmount = false;
        let borrowFiatAmount = "";
        let withdrawAmount = "";

        switch (type) {
            case "Borrow":
                resultTable = await this.backofficeService.getFiatTxByBorrowId(
                    page - 1,
                    id,
                    sortField,
                    sortDirection
                );
                const borrowRequest =
                    await this.backofficeService.getBorrowRequestExtendCreditLineAndUserPaymentReq(id);
                borrowIban = borrowRequest?.creditLine.userPaymentRequisite.iban || "";
                checkBorrowFiatAmount = !!borrowRequest?.borrowFiatAmount;
                initialRiskStrategy = truncateDecimalsToStr(
                    formatUnits(borrowRequest?.initialRiskStrategy ?? 0n),
                    2,
                    false
                );
                status = {
                    status: borrowRequest?.borrowRequestStatus || "",
                    id: borrowRequest?.id || 0,
                    wallet: "",
                };
                borrowFiatAmount = truncateDecimalsToStr(
                    formatUnits(borrowRequest?.borrowFiatAmount ?? 0n),
                    2,
                    false
                );
                break;
            case "Deposit":
                resultTable = await this.backofficeService.getCryptoTxByDepId(
                    page - 1,
                    id,
                    sortField,
                    sortDirection
                );
                const depositStatus = await this.backofficeService.getDepositReqStatusById(id);
                status = {
                    status: depositStatus?.depositRequestStatus || "",
                    id: depositStatus?.id || 0,
                    wallet: "",
                };
                break;
            case "Withdraw":
                resultTable = await this.backofficeService.getCryptoTxByWithdrawId(
                    page - 1,
                    id,
                    sortField,
                    sortDirection
                );
                const withdrawRequest = await this.backofficeService.getWithdrawReqById(id);
                status = {
                    status: withdrawRequest?.withdrawRequestStatus || "",
                    id: withdrawRequest?.id || 0,
                    wallet: withdrawRequest?.walletToWithdraw || "",
                };
                withdrawAmount = truncateDecimalsToStr(
                    formatUnits(withdrawRequest?.withdrawAmount ?? 0n),
                    2,
                    false
                );
                break;
            case "Repay":
                resultTable = await this.backofficeService.getFiatTxByRepayId(
                    page - 1,
                    id,
                    sortField,
                    sortDirection
                );
                const repayStatus = await this.backofficeService.getRepayStatusById(id);
                status = {
                    status: repayStatus?.repayRequestStatus || "",
                    id: repayStatus?.id || 0,
                    wallet: "",
                };
                const repayRequestExtendBusinessPaymentRequisite =
                    await this.backofficeService.getRepayReqExtBusinessPaymentReq(id);
                associatedXLineInfo = {
                    bankName:
                        repayRequestExtendBusinessPaymentRequisite?.businessPaymentRequisite.bankName ||
                        "",
                    iban:
                        repayRequestExtendBusinessPaymentRequisite?.businessPaymentRequisite.iban || "",
                };
                break;
        }
        const checkStatus = (type: string, status: string) => {
            switch (type) {
                case "Deposit":
                    return DepositRequestStatus[status as DepositRequestStatus];

                case "Borrow":
                    return BorrowRequestStatus[status as BorrowRequestStatus];

                case "Withdraw":
                    return WithdrawRequestStatus[status as WithdrawRequestStatus];

                case "Repay":
                    return RepayRequestStatus[status as RepayRequestStatus];

                default:
                    return "";
            }
        };
        const queryWithDefaults = {
            page: page > 1 ? page : undefined,
            sortField,
            sortDirection,
        };
        if (!checkStatus(type, status.status)) {
            throw new HttpException("Not found", HttpStatus.NOT_FOUND);
        }

        const resultPageInfo = {
            mainInfo: {
                name: generalUserInfoByCreditLineId?.user.name,
                chatId: generalUserInfoByCreditLineId?.user.chatId,
                debt: generalUserInfoByCreditLineId?.debtCurrency.symbol,
                collateral: generalUserInfoByCreditLineId?.collateralCurrency.symbol,
                type,
                refNumber: createRepayRequestRefNumber(
                    generalUserInfoByCreditLineId?.refNumber || "",
                    Number(id)
                ),
                address: await this.paymentProcessingService.getUserWallet(
                    String(generalUserInfoByCreditLineId?.user.chatId),
                    String(generalUserInfoByCreditLineId?.collateralCurrency.symbol)
                ),
                initialRiskStrategy,
                status: checkStatus(type, status.status),
                id: status.id,
                wallet: status.wallet,
                associatedXLineInfo,
                borrowIban,
                checkBorrowFiatAmount,
                borrowFiatAmount,
                withdrawAmount,
                creditLineId,
                customerId,
            },
            rowTable: resultTable.map(item => {
                return {
                    ...item,
                    createdAt: moment(item.createdAt).format("DD.MM.YYYY HH:mm"),
                    updatedAt: moment(item.updatedAt).format("DD.MM.YYYY HH:mm"),
                    rawTransferAmount: formatUnits(item.rawTransferAmount),
                    usdTransferAmount: truncateDecimalsToStr(
                        formatUnits((item as CryptoTransaction).usdTransferAmount ?? 0n),
                        2,
                        false
                    ),
                };
            }),
            depTable: type === "Withdraw" || type === "Deposit",
        };

        return {
            resultPageInfo,
            page: {
                query: queryWithDefaults,
            },
        };
    }

    @Get("customers/creditline-user-list/:customerId/:creditLineId")
    @Render("backoffice/creditline-user-list")
    async userCreditLineList(
        @Res() res: Response,
        @Param("customerId") customerId: string,
        @Param("creditLineId") creditLineId: string,
        @TransactionsQuery() query: TransactionsDto
    ) {
        const { page, sortField, sortDirection } = query;
        const initialRequestByCreditLineId = await this.backofficeService.getAllRequestByCreditLine(
            page - 1,
            creditLineId,
            sortField,
            sortDirection
        );
        if (!initialRequestByCreditLineId.length) {
            throw new HttpException("Not found", HttpStatus.NOT_FOUND);
        }
        const checkStatus = (type: string, status: string) => {
            switch (type) {
                case "Deposit":
                    return DepositRequestStatus[status as DepositRequestStatus];

                case "Borrow":
                    return BorrowRequestStatus[status as BorrowRequestStatus];

                case "Withdraw":
                    return WithdrawRequestStatus[status as WithdrawRequestStatus];

                case "Repay":
                    return RepayRequestStatus[status as RepayRequestStatus];

                default:
                    return "";
            }
        };

        const resultTransactions = initialRequestByCreditLineId.map(request => {
            return {
                ...request,
                created_at: moment(request.created_at).format("DD.MM.YYYY HH:mm"),
                updated_at: moment(request.created_at).format("DD.MM.YYYY HH:mm"),
                status: checkStatus(request.type, request.status),
            };
        });

        const countTransaction = await this.backofficeService.getCountRequestByCreditLine(creditLineId);
        const totalCount = countTransaction[0]?.count;
        const generalUserInfoAndCurrencySymbol =
            await this.backofficeService.getCreditLineByIdExtUserInfoAndDebtCollCurrency(creditLineId);

        const queryWithDefaults = {
            page: page > 1 ? page : undefined,
            sortField,
            sortDirection,
        };

        const resultTable = {
            mainInfo: {
                name: generalUserInfoAndCurrencySymbol?.user.name,
                chatId: generalUserInfoAndCurrencySymbol?.user.chatId,
                debt: generalUserInfoAndCurrencySymbol?.debtCurrency.symbol,
                collateral: generalUserInfoAndCurrencySymbol?.collateralCurrency.symbol,
            },
            rowTable: resultTransactions,
        };
        const totalPageCount = Math.ceil(Number(totalCount) / PAGE_LIMIT_REQUEST);
        return {
            resultTable,
            creditLineId,
            customerId,
            page: {
                current: page,
                query: queryWithDefaults,
                totalPageCount,
                pages: makePagination({
                    currentPage: page,
                    totalPageCount,
                    siblingCount: 1,
                }),
                disabled: Number(totalCount) > PAGE_LIMIT_REQUEST,
            },
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("customers-credit-line/:customerId")
    @Render("backoffice/customer-credit-line")
    async customerCreditLine(@Res() res: Response, @Param("customerId") customerId: string) {
        const fullyAssociatedUser = await this.backofficeService.getFullyAssociatedUserById(customerId);
        if (!fullyAssociatedUser) {
            throw new HttpException("Not found", HttpStatus.NOT_FOUND);
        }
        //TODO: fix after PR will be merged
        // const usdAvailableLiquidity = this.priceOracleService.convertCryptoToUsd(
        //     collateralCurrency.symbol,
        //     collateralCurrency.decimals,
        //     lineDetails.maxAllowedCryptoToWithdraw,
        //     scaledTokenPrice
        // );
        let allCreditLine: CreditLineDetailsType[] = [];
        if (fullyAssociatedUser?.creditLines.length) {
            allCreditLine = await Promise.all(
                fullyAssociatedUser?.creditLines.map(async (item, idx) => {
                    const creditLine =
                        await this.creditLineService.getCreditLinesByIdAllSettingsExtended(+item.id);
                    const fiatDepositAmount = await this.priceOracleService.convertCryptoToUsd(
                        creditLine.collateralCurrency.symbol,
                        creditLine.collateralCurrency.decimals,
                        creditLine.rawDepositAmount
                    );
                    const utilizationRate = this.riskEngineService.calculateUtilizationRate(
                        fiatDepositAmount,
                        creditLine.debtAmount
                    );

                    return {
                        serialNumber: idx + 1,
                        creditLineId: item.id,
                        debtSymbol: item.debtCurrency.symbol,
                        collateralSymbol: item.collateralCurrency.symbol,
                        amountsTable: {
                            rawDepositAmount: formatUnits(
                                creditLine.rawDepositAmount,
                                creditLine.collateralCurrency.decimals
                            ), // raw collateral amount, use collateral decimals to convert to float
                            usdDepositAmount: truncateDecimalsToStr(
                                formatUnits(fiatDepositAmount, creditLine.debtCurrency.decimals),
                                2,
                                false
                            ), // raw fiat amount, use debt currency decimals to convert to float
                            usdCollateralAmount: truncateDecimalsToStr(
                                formatUnits(
                                    (fiatDepositAmount *
                                        creditLine.economicalParameters.collateralFactor) /
                                        EXP_SCALE,
                                    creditLine.debtCurrency.decimals
                                ),
                                2,
                                false
                            ), // raw fiat amount, use debt currency decimals to convert to float
                            debtAmount: truncateDecimalsToStr(
                                formatUnits(creditLine.debtAmount, creditLine.debtCurrency.decimals),
                                2,
                                false
                            ), // raw fiat amount, use debt currency decimals to convert to float
                            //TODO: fix after PR will be merged
                            usdAvailableLiquidity: 1, // Usd value, has 18 decimals accuracy
                        },
                        currentState: {
                            utilizationFactor: truncateDecimalsToStr(
                                formatUnits(utilizationRate * 100n),
                                2,
                                false
                            ), // All rates have 18 decimals accuracy
                            healthyFactor: truncateDecimalsToStr(
                                formatUnits(creditLine.healthyFactor),
                                2,
                                false
                            ), // All rates have 18 decimals accuracy
                        },
                        appliedRates: {
                            collateralFactor: truncateDecimalsToStr(
                                formatUnits(creditLine.economicalParameters.collateralFactor * 100n),
                                2,
                                false
                            ), // All rates have 18 decimals accuracy
                            liquidationFactor: truncateDecimalsToStr(
                                formatUnits(creditLine.economicalParameters.liquidationFactor * 100n),
                                2,
                                false
                            ), // All rates have 18 decimals accuracy
                        },
                        dates: {
                            createdAt: moment(item.createdAt).format("DD.MM.YYYY HH:mm"),
                            updatedAt: moment(item.updatedAt).format("DD.MM.YYYY HH:mm"),
                        },
                        associatedRequisites: {
                            iban: item.userPaymentRequisite.iban,
                            refNumber: item.refNumber,
                        },
                    };
                })
            );
        }
        const resultTablesData = {
            mainInfo: {
                name: fullyAssociatedUser?.name,
                chatId: fullyAssociatedUser?.chatId,
                customerId,
            },
            allCreditLine,
        };

        return resultTablesData;
    }

    @Roles(Role.ADMIN)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("operators")
    @Render("backoffice/operators")
    @UsePipes(
        new ValidationPipe({
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        })
    )
    async operators(@Req() req: Request, @OperatorsListQuery() query: OperatorsListDto) {
        const { page, role, username, sort } = query;
        const userFilter = username?.trim() ?? "";
        const queryWithDefaults = {
            page: page > 1 ? page : undefined,
            role: role ? role : undefined,
            username: userFilter ? userFilter : undefined,
            sort: sort != OperatorsListColumns.updated ? sort : undefined,
        };
        const takePerPage = 15;
        const [[operators, totalCount], currencies] = await Promise.all([
            this.backofficeService.getOperators(
                {
                    skip: page - 1,
                    take: takePerPage,
                },
                sort,
                userFilter,
                role
            ),
            [], // MOCKED
        ]);
        const totalPageCount = Math.ceil(totalCount / takePerPage);
        return {
            account: req.user,
            operators,
            currencies,
            query: queryWithDefaults,
            roles: Object.values(Role),
            page: {
                current: page,
                totalPageCount,
                pages: makePagination({
                    currentPage: page,
                    totalPageCount,
                    siblingCount: 1,
                }),
            },
        };
    }
}
