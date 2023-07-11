import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { CreditLineDetailsDto } from "../dto/credit-line-details.dto";

export const BusinessRequisites = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new CreditLineDetailsDto();
    result.page = request.query.page ? Number(request.query.page) : 1;
    result.sortField = request.query.sortField;
    result.sortDirection = request.query.sortDirection;
    return result;
});
