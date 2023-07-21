import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { EconomicalParametersDto } from "../dto/economical.dto";

export const EconomicalParametersDecorator = createParamDecorator(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        const result = new EconomicalParametersDto();
        result.debt = request.query.debt;
        result.collateral = request.query.collateral;
        return result;
    }
);
