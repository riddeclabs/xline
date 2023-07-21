import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { CustomersListDto } from "../dto/customers.dto";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CustomersListQuery = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const result = new CustomersListDto();
    result.page = request.query.page ? Number(request.query.page) : 1;
    result.sort = request.query.sort;
    result.username = request.query.username;
    result.chatId = request.query.chatId;
    return result;
});
