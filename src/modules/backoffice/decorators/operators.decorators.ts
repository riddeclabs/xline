import { ExecutionContext, createParamDecorator } from "@nestjs/common";

import { OperatorsListDto } from "../dto";

export const OperatorsListQuery = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new OperatorsListDto();
    result.page = request.query.page ? Number(request.query.page) : 1;
    result.role = request.query.role;
    result.sort = request.query.sort;
    result.username = request.query.username;
    return result;
});
