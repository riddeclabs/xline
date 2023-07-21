import { ExecutionContext, createParamDecorator } from "@nestjs/common";

import { OperatorsListDto } from "../dto";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const OperatorsListQuery = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new OperatorsListDto();
    result.page = request.query.page ? Number(request.query.page) : 1;
    result.role = request.query.role;
    result.sort = request.query.sort;
    result.username = request.query.username;
    return result;
});
