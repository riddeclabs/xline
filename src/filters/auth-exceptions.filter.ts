import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    UnauthorizedException,
    ForbiddenException,
} from "@nestjs/common";

import { Request, Response } from "express";

@Catch(HttpException)
export class AuthExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        if (exception instanceof UnauthorizedException || exception instanceof ForbiddenException) {
            request.flash("loginError", "Authorization failed! Try again.");
            response.redirect("/backoffice/auth");
        } else {
            request.flash("error", `Error: ${exception.message}, status: ${exception.getStatus()}`);
            response.redirect("/backoffice/error");
        }
    }
}
