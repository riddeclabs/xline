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
} from "@nestjs/common";

import { OperatorsListQuery } from "./decorators";

import { Response, Request } from "express";

import { makePagination, Role } from "src/common";
import { Roles } from "src/decorators/roles.decorator";
import { AuthExceptionFilter } from "src/filters/auth-exceptions.filter";
import { AuthenticatedGuard } from "src/guards/authenticated.guard";
import { LoginGuard } from "src/guards/login.guard";
import { RoleGuard } from "src/guards/role.guard";
import { OperatorsListDto } from "./dto";
import { BackOfficeService, OperatorsListColumns } from "./backoffice.service";
import { PAGE_LIMIT, PAGE_LIMIT_REQUEST } from "src/common/constants";
import { CustomersListDto } from "./dto/customers.dto";
import { CustomersListQuery } from "./decorators/customers.decorators";
import * as moment from "moment";
import { BorrowRequestDto } from "./dto/borrow-request.dto";

@Controller("backoffice")
@UseFilters(AuthExceptionFilter)
export class BackOfficeController {
    constructor(private backofficeService: BackOfficeService) {}

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
    home(@Req() req: Request) {
        return {
            account: req.user,
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
    async borrowList(@Req() req: Request, @CustomersListQuery() query: BorrowRequestDto) {
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
                borrow_created_at: moment(item.borrow_created_at).format("DD.MM.YYYY HH:mm"),
                borrow_updated_at: moment(item.borrow_updated_at).format("DD.MM.YYYY HH:mm"),
                borrow_borrow_fiat_amount: item.borrow_borrow_fiat_amount ?? 0,
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
    async repayList(@Req() req: Request, @CustomersListQuery() query: CustomersListDto) {
        const { page } = query;

        const getAllRepay = await this.backofficeService.getAllRepayRequest(page - 1);
        const allRepayResult = getAllRepay.map(item => {
            return {
                ...item,
                borrow_created_at: moment(item.repay_created_at).format("DD.MM.YYYY HH:mm"),
                borrow_updated_at: moment(item.repay_updated_at).format("DD.MM.YYYY HH:mm"),
            };
        });

        const totalCount = await this.backofficeService.getRepayCount();
        const totalPageCount = Math.ceil(totalCount / PAGE_LIMIT_REQUEST);
        const queryWithDefaults = {
            page: page > 1 ? page : undefined,
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
