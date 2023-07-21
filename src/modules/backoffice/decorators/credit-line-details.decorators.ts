import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { CreditLineDetailsDto } from "../dto/credit-line-details.dto";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CreditLineDetails = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new CreditLineDetailsDto();
    result.page = request.query.page ? Number(request.query.page) : 1;
    result.sortField = request.query.sortField;
    result.sortDirection = request.query.sortDirection;
    return result;
});
