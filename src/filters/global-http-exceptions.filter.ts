import { Catch, ArgumentsHost, HttpException, Logger } from "@nestjs/common";

@Catch(HttpException)
export class GlobalHttpExceptionFilter {
    private logger = new Logger("GlobalHttpExceptionFilter");

    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status = exception.getStatus();
        const message = exception.message;

        this.logger.error(`HTTP Exception: ${status} - ${message}`);

        if (status === 404) {
            response.redirect("/backoffice/404");
        } else if (status === 403 || status === 401) {
            request.flash("loginError", "Authorization failed! Try again.");
            response.redirect("/backoffice/auth");
        } else {
            response.status(status).json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                message: message,
            });
        }
    }
}
