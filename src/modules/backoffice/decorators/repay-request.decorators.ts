import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { RepayRequestDto } from "../dto/repay-request.dto";

export const RepayListQuery = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new RepayRequestDto();
    result.page = request.query.page ? Number(request.query.page) : 1;
    result.sort = request.query.sort;
    result.refNumber = request.query.refNumber;
    result.chatId = request.query.chatId;
    return result;
});
