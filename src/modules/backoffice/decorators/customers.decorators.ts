import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { CustomersListDto } from "../dto/customers.dto";


export const CustomersListQuery = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    //const request = ctx.switchToHttp().getRequest();

    const result = new CustomersListDto();
    //result.page = request.query.page ? Number(request.query.page) : 1;
    
    return result;
});
