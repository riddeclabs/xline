import { Controller, Get, Param } from "@nestjs/common";
import { RequestHandlerService } from "./request-handler.service";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Request handler")
@Controller("request-handler")
export class RequestHandlerController {
    constructor(private readonly requestHandlerService: RequestHandlerService) {}

    @Get("deposit/:lineId")
    getAllDepositReqByLineId(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getAllDepositReqByLineId(+creditLineId);
    }
    @Get("deposit/pending/:lineId")
    getOldestPendingDepositReq(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getOldestPendingDepositReq(+creditLineId);
    }

    @Get("withdraw/:lineId")
    getAllWithdrawReqByLineId(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getAllWithdrawReqByLineId(+creditLineId);
    }

    @Get("withdraw/pending/:lineId")
    getOldestPendingWithdrawReq(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getOldestPendingWithdrawReq(+creditLineId);
    }

    @Get("borrow/:lineId")
    getAllBorrowReqByLineId(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getAllBorrowReqByLineId(+creditLineId);
    }
    @Get("borrow/pending/:lineId")
    getOldestPendingBorrowReq(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getOldestPendingBorrowReq(+creditLineId);
    }

    @Get("repay/:lineId")
    getAllRepayReqByLineId(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getAllRepayReqByLineId(+creditLineId);
    }
    @Get("repay/pending/:lineId")
    getOldestPendingRepayReq(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getOldestPendingRepayReq(+creditLineId);
    }
}
