import { Controller, Post, Body, Param, UsePipes, ValidationPipe } from "@nestjs/common";
import { RequestResolverService } from "./request-resolver.service";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResolveFiatBasedRequestDto, ResolveRepayRequestDto } from "./dto/resolve-request.dto";

@ApiTags("Request resolver")
@Controller("request-resolver")
export class RequestResolverController {
    constructor(private readonly requestResolverService: RequestResolverService) {}

    @Post("resolve-request/borrow")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Resolve borrow request" })
    @ApiBody({ description: "Resolve borrow request", type: ResolveFiatBasedRequestDto })
    async resolveBorrowRequest(@Body() resolveBorrowRequestDto: ResolveFiatBasedRequestDto) {
        return this.requestResolverService.resolveBorrowRequest(resolveBorrowRequestDto);
    }

    @Post("resolve-request/borrow-finalize")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Finalize borrow request" })
    async finalizeBorrowRequest(@Param("reqId") reqId: string) {
        return this.requestResolverService.finalizeBorrowRequest(+reqId);
    }

    @Post("resolve-request/borrow-reject")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Reject borrow request" })
    async rejectBorrowRequest(@Param("reqId") reqId: string) {
        return this.requestResolverService.rejectBorrowRequest(+reqId);
    }

    @Post("resolve-request/repay")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Resolve repay request" })
    @ApiBody({ description: "Resolve repay request", type: ResolveRepayRequestDto })
    async resolveRepayRequest(@Body() resolveRepayRequestDto: ResolveRepayRequestDto) {
        return this.requestResolverService.resolveRepayRequest(resolveRepayRequestDto);
    }
}
