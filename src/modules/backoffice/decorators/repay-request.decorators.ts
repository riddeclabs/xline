import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { RepayRequestDto } from "../dto/repay-request.dto";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const RepayListQuery = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new RepayRequestDto();
    result.page = request.query.page ? Number(request.query.page) : 1;
    result.sort = request.query.sort;
    result.refNumber = request.query.refNumber;
    result.chatId = request.query.chatId;
    return result;
});
