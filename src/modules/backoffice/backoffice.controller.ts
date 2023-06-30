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
    UseFilters,
    ValidationPipe,
    UsePipes,
    Param,
    Body,
} from "@nestjs/common";

import { OperatorsListQuery } from "./decorators";

import { Response, Request } from "express";

import {
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
import { AuthExceptionFilter } from "src/filters/auth-exceptions.filter";
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
import { BotManagerService } from "../bot/bot-manager.service";
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

@Controller("backoffice")
@UseFilters(AuthExceptionFilter)
export class BackOfficeController {
    constructor(
        private backofficeService: BackOfficeService,
        private priceOracleService: PriceOracleService,
        private readonly botManager: BotManagerService
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

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("home")
    @Render("backoffice/home")
    async home(@Req() req: Request) {
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

        const totalSupply = collateralCurrencyAmount.map(item => item.amount).reduce((a, b) => a + b, 0);

        const debtCurrencyInitial = await this.backofficeService.getDebtCurrency();

        const totalDebt = debtCurrencyInitial.map(item => item.amount).reduce((a, b) => +a + +b, 0);
        return {
            totalCustomers: allCustomersLength,
            totalSupply,
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
    economical(@Req() req: Request) {
        return {
            account: req.user,
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("xline-request")
    @Render("backoffice/xline-request")
    xlineRequest(@Req() req: Request) {
        return {
            account: req.user,
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("borrow-request")
    @Render("backoffice/borrow-request")
    async borrowList(@Req() req: Request, @BorrowRequest() query: BorrowRequestDto) {
        const { page, sort, chatId } = query;
        const chatIdFilter = chatId?.trim() ?? "";

        const getAllBorrow = await this.backofficeService.getAllBorrowRequest(
            page - 1,
            sort,
            chatIdFilter
        );
        const allBorrowResult = getAllBorrow.map(item => {
            return {
                ...item,
                createdAt: moment(item.createdAt).format("DD.MM.YYYY HH:mm"),
                updatedAt: moment(item.updatedAt).format("DD.MM.YYYY HH:mm"),
                borrowFiatAmount: item.borrowFiatAmount ?? 0,
            };
        });
        const totalCount = await this.backofficeService.getBorrowCount();
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
    async repayList(@Req() req: Request, @RepayListQuery() query: RepayRequestDto) {
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

        const totalCount = await this.backofficeService.getRepayCount();
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
    @Get("repay-request/:id")
    @Render("backoffice/repay-request-item")
    async repayItem(@Req() req: Request, @Param("id") id: string) {
        const repayRequestById = await this.backofficeService.getRepayRequestById(id);
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
    @Get("borrow-request/:id")
    @Render("backoffice/unresolved-request-borrow")
    async borrowRequest(@Req() req: Request, @Param("id") id: string) {
        return { id };
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
    @Get("customers/credit-line-detail/:type/:creditLineId/:id")
    @Render("backoffice/credit-line-detail")
    async creditLineDetails(
        @Param("id") id: string,
        @Param("creditLineId") creditLineId: string,
        @Param("type") type: string,
        @CreditLineDetails() query: CreditLineDetailsDto
    ) {
        const { page, sortField, sortDirection } = query;
        const generalUserInfo = await this.backofficeService.getGeneralUserInfoAndCurrencySymbol(
            creditLineId
        );
        let initialRistStrategy = "";
        let resultTable: FiatTransaction[] | CryptoTransaction[] = [];
        const borrow = await this.backofficeService.getBorrowRequest(id);
        let status = { id: 0, status: "" };
        switch (type) {
            case "Borrow":
                resultTable = await this.backofficeService.getBorrowRequestDetails(
                    page - 1,
                    id,
                    sortField,
                    sortDirection
                );
                initialRistStrategy = truncateDecimalsToStr(
                    formatUnits(borrow?.initialRiskStrategy ?? 0n),
                    2,
                    false
                );
                const borrowStatus = await this.backofficeService.getBorrowStatus(id);
                status = { status: borrowStatus?.borrowRequestStatus || "", id: borrowStatus?.id || 0 };
                break;
            case "Deposit":
                resultTable = await this.backofficeService.getDepositRequestDetails(
                    page - 1,
                    id,
                    sortField,
                    sortDirection
                );
                const depositStatus = await this.backofficeService.getDepositStatus(id);
                status = {
                    status: depositStatus?.depositRequestStatus || "",
                    id: depositStatus?.id || 0,
                };
                break;
            case "Withdraw":
                resultTable = await this.backofficeService.getWithdrawRequestDetails(
                    page - 1,
                    id,
                    sortField,
                    sortDirection
                );
                const withdrawStatus = await this.backofficeService.getWithdrawStatus(id);
                status = {
                    status: withdrawStatus?.withdrawRequestStatus || "",
                    id: withdrawStatus?.id || 0,
                };
                break;
            case "Repay":
                resultTable = await this.backofficeService.getRepayRequestDetails(
                    page - 1,
                    id,
                    sortField,
                    sortDirection
                );
                const repayStatus = await this.backofficeService.getRepayStatus(id);
                status = {
                    status: repayStatus?.repayRequestStatus || "",
                    id: repayStatus?.id || 0,
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

        const resultPageInfo = {
            mainInfo: {
                name: generalUserInfo?.user.name,
                chatId: generalUserInfo?.user.chatId,
                debt: generalUserInfo?.debtCurrency.symbol,
                collateral: generalUserInfo?.collateralCurrency.symbol,
                type,
                refNumber: createRepayRequestRefNumber(generalUserInfo?.refNumber || "", Number(id)),
                address: await this.botManager.getUserWallet(
                    String(generalUserInfo?.user.chatId),
                    String(generalUserInfo?.collateralCurrency.symbol)
                ),
                initialRistStrategy,
                status: checkStatus(type, status.status),
                id: status.id,
            },
            rowTable: resultTable.map(item => {
                return {
                    ...item,
                    createdAt: moment(item.createdAt).format("DD.MM.YYYY HH:mm"),
                    updatedAt: moment(item.updatedAt).format("DD.MM.YYYY HH:mm"),
                    rawTransferAmount: truncateDecimalsToStr(
                        formatUnits(item.rawTransferAmount),
                        2,
                        false
                    ),
                    usdTransferAmount: truncateDecimalsToStr(
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        //@ts-ignore
                        formatUnits(item.usdTransferAmount ?? 0n),
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

    @Get("customers/creditline-user-list/:creditLineId")
    @Render("backoffice/creditline-user-list")
    async userCreditLineList(
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
            await this.backofficeService.getGeneralUserInfoAndCurrencySymbol(creditLineId);

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
    @Get("customers-credit-line/:userId")
    @Render("backoffice/customer-credit-line")
    async customerCreditLine(@Param("userId") userId: string) {
        const fullyAssociatedUser = await this.backofficeService.getFullyAssociatedUserById(userId);
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
                    const { economicalParams, lineDetails } = await this.botManager.getCreditLineDetails(
                        item.id
                    );
                    return {
                        serialNumber: idx + 1,
                        creditLineId: item.id,
                        debtSymbol: item.debtCurrency.symbol,
                        collateralSymbol: item.collateralCurrency.symbol,
                        amountsTable: {
                            rawSupplyAmount: formatUnits(
                                lineDetails.rawCollateralAmount,
                                lineDetails.collateralCurrency.decimals
                            ), // raw collateral amount, use collateral decimals to convert to float
                            usdSupplyAmount: truncateDecimalsToStr(
                                formatUnits(
                                    lineDetails.fiatCollateralAmount,
                                    lineDetails.debtCurrency.decimals
                                ),
                                2,
                                false
                            ), // raw fiat amount, use debt currency decimals to convert to float
                            usdCollateralAmount: truncateDecimalsToStr(
                                formatUnits(
                                    (lineDetails.fiatCollateralAmount *
                                        economicalParams.collateralFactor) /
                                        EXP_SCALE,
                                    lineDetails.debtCurrency.decimals
                                ),
                                2,
                                false
                            ), // raw fiat amount, use debt currency decimals to convert to float
                            debtAmount: truncateDecimalsToStr(
                                formatUnits(lineDetails.debtAmount, lineDetails.debtCurrency.decimals),
                                2,
                                false
                            ), // raw fiat amount, use debt currency decimals to convert to float
                            //TODO: fix after PR will be merged
                            usdAvailableLiquidity: 1, // Usd value, has 18 decimals accuracy
                        },
                        currentState: {
                            utilizationFactor: truncateDecimalsToStr(
                                formatUnits(lineDetails.utilizationRate * 100n),
                                2,
                                false
                            ), // All rates have 18 decimals accuracy
                            healthyFactor: truncateDecimalsToStr(
                                formatUnits(lineDetails.healthyFactor),
                                2,
                                false
                            ), // All rates have 18 decimals accuracy
                        },
                        appliedRates: {
                            collateralFactor: truncateDecimalsToStr(
                                formatUnits(economicalParams.collateralFactor * 100n),
                                2,
                                false
                            ), // All rates have 18 decimals accuracy
                            liquidationFactor: truncateDecimalsToStr(
                                formatUnits(economicalParams.liquidationFactor * 100n),
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
            },
            allCreditLine,
        };

        return resultTablesData;
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Post("/request-resolver/resolve-request/borrow")
    async requestResolve(@Req() req: Request, @Body() preload: any) {
        return;
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
