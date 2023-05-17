import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { RequestResolverService } from "./request-resolver.service";
import { ApiTags } from "@nestjs/swagger";
import { ResolveFiatBasedRequestDto } from "./dto/resolve-request.dto";

@ApiTags("Request resolver")
@Controller("request-resolver")
export class RequestResolverController {
    constructor(private readonly requestResolverService: RequestResolverService) {}

    @Post("resolve-request/borrow")
    async resolveBorrowRequest(@Body() resolveBorrowRequestDto: ResolveFiatBasedRequestDto) {
        return this.requestResolverService.resolveBorrowRequest(resolveBorrowRequestDto);
    }

    @Post("resolve-request/repay")
    async resolveRepayRequest(@Body() resolveRepayRequestDto: ResolveFiatBasedRequestDto) {
        return this.requestResolverService.resolveRepayRequest(resolveRepayRequestDto);
    }

    @Get("verify/borrow:reqId")
    async verifyBorrowRequest(@Param("reqId") reqId: string) {
        return this.requestResolverService.verifyBorrowRequest(+reqId);
    }
}
