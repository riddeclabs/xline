import { Controller, Post, Body, UsePipes, ValidationPipe } from "@nestjs/common";
import { RequestResolverService } from "./request-resolver.service";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import {
    FinalizeOrRejectBorrowRequestDto,
    ResolveFiatBasedRequestDto,
    ResolveRepayRequestDto,
} from "./dto/resolve-request.dto";

@ApiTags("Request resolver")
@Controller("request-resolver")
export class RequestResolverController {
    constructor(private readonly requestResolverService: RequestResolverService) {}

    // FIXME: Uncomment during backoffice implementation
    //    @Roles(Role.ADMIN, Role.OPERATOR)
    //    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Post("resolve-request/borrow")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Resolve borrow request" })
    @ApiBody({ description: "Resolve borrow request", type: ResolveFiatBasedRequestDto })
    async resolveBorrowRequest(@Body() resolveBorrowRequestDto: ResolveFiatBasedRequestDto) {
        return this.requestResolverService.resolveBorrowRequest(resolveBorrowRequestDto);
    }

    // FIXME: Uncomment during backoffice implementation
    //    @Roles(Role.ADMIN, Role.OPERATOR)
    //    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Post("resolve-request/borrow-finalize")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Finalize borrow request" })
    @ApiBody({ description: "Finalize borrow request", type: FinalizeOrRejectBorrowRequestDto })
    async finalizeBorrowRequest(
        @Body() finalizeOrRejectBorrowRequestDto: FinalizeOrRejectBorrowRequestDto
    ) {
        return this.requestResolverService.finalizeBorrowRequest(finalizeOrRejectBorrowRequestDto);
    }

    // FIXME: Uncomment during backoffice implementation
    //    @Roles(Role.ADMIN, Role.OPERATOR)
    //    @UseGuards(AuthenticatedGuard, RoleGuard)
    @Post("resolve-request/borrow-reject")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Reject borrow request" })
    @ApiBody({ description: "Reject borrow request", type: FinalizeOrRejectBorrowRequestDto })
    async rejectBorrowRequest(
        @Body() finalizeOrRejectBorrowRequestDto: FinalizeOrRejectBorrowRequestDto
    ) {
        return this.requestResolverService.rejectBorrowRequest(finalizeOrRejectBorrowRequestDto);
    }

    @Post("resolve-request/repay")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Resolve repay request" })
    @ApiBody({ description: "Resolve repay request", type: ResolveRepayRequestDto })
    async resolveRepayRequest(@Body() resolveRepayRequestDto: ResolveRepayRequestDto) {
        return this.requestResolverService.resolveRepayRequest(resolveRepayRequestDto);
    }
}
