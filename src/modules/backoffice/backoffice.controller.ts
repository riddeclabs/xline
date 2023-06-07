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

@Controller("backoffice")
@UseFilters(AuthExceptionFilter)
export class BackOfficeController {
    constructor(
        private backofficeService: BackOfficeService // private readonly userService: UserService
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
    @Get("xlineRequest")
    @Render("backoffice/xlineRequest")
    xlineRequest(@Req() req: Request) {
        return {
            account: req.user,
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("unRequest")
    @Render("backoffice/unRequest")
    table(@Req() req: Request) {
        return {
            account: req.user,
        };
    }

    @Roles(Role.ADMIN, Role.OPERATOR)
    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Get("customers")
    @Render("backoffice/customers")
    async getCustomers(@Req() req: Request) {
        const customers = await this.backofficeService.getCustomers();
        const customersWithActiveLines = customers.map(customer => {
            return {
                id: customer.id,
                chatId: customer.chatId,
                name: customer.name,
                activeLines: customer.creditLines.length,
            };
        });
        return { customers: customersWithActiveLines };
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
