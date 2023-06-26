import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { CreditLineDetailsDto } from "../dto/credit-line-details.dto";

export const CreditLineDetails = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new CreditLineDetailsDto();
    result.createdAt = request.query.createdAt;
    return result;
});
