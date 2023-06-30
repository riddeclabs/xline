import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { TransactionsDto } from "../dto/transactions.dto";

export const TransactionsQuery = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new TransactionsDto();
    result.page = request.query.page ? Number(request.query.page) : 1;
    result.sortField = request.query.sortField;
    result.sortDirection = request.query.sortDirection;
    return result;
});
