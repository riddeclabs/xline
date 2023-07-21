import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { RepayRequestDto } from "../dto/repay-request.dto";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const BorrowRequest = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new RepayRequestDto();
    result.page = request.query.page ? Number(request.query.page) : 1;
    result.sort = request.query.sort;
    result.chatId = request.query.chatId;
    return result;
});
