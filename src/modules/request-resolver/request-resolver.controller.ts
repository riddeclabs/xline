import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe } from "@nestjs/common";
import { RequestResolverService } from "./request-resolver.service";
import { ApiTags } from "@nestjs/swagger";
import { ResolveFiatBasedRequestDto, ResolveRepayRequestDto } from "./dto/resolve-request.dto";

@ApiTags("Request resolver")
@Controller("request-resolver")
export class RequestResolverController {
    constructor(private readonly requestResolverService: RequestResolverService) {}

    @Post("resolve-request/borrow")
    @UsePipes(ValidationPipe)
    async resolveBorrowRequest(@Body() resolveBorrowRequestDto: ResolveFiatBasedRequestDto) {
        return this.requestResolverService.resolveBorrowRequest(resolveBorrowRequestDto);
    }

    @Post("resolve-request/repay")
    @UsePipes(ValidationPipe)
    async resolveRepayRequest(@Body() resolveRepayRequestDto: ResolveRepayRequestDto) {
        await this.requestResolverService.resolveRepayRequest(resolveRepayRequestDto);
        return {
            success: true,
        };
    }

    @Post("reject-request/repay")
    @UsePipes(ValidationPipe)
    async rejectRepayRequest(@Body() rejectBody: { repayId: number }) {
        await this.requestResolverService.rejectRepayRequest(rejectBody.repayId);
        return {
            success: true,
        };
    }

    @Get("verify/borrow:reqId")
    async verifyBorrowRequest(@Param("reqId") reqId: string) {
        return this.requestResolverService.verifyBorrowRequest(+reqId);
    }
}
