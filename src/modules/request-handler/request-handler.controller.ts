import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { RequestHandlerService } from "./request-handler.service";
import { ApiTags } from "@nestjs/swagger";
import { formatUnits } from "../../common";

@ApiTags("Request handler")
@Controller("request-handler")
export class RequestHandlerController {
    constructor(private readonly requestHandlerService: RequestHandlerService) {}

    @Get("deposit/all/:lineId")
    getAllDepositReqByLineId(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getAllDepositReqByLineId(+creditLineId);
    }
    @Get("deposit/pending/:lineId")
    getOldestPendingDepositReq(@Param("lineId") creditLineId: string) {
        const depositRequest = this.requestHandlerService.getOldestPendingDepositReq(+creditLineId);

        if (!depositRequest) {
            throw new HttpException("Pending deposit request not found", HttpStatus.NOT_FOUND);
        }
    }

    @Get("withdraw/all/:lineId")
    getAllWithdrawReqByLineId(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getAllWithdrawReqByLineId(+creditLineId);
    }

    @Get("withdraw/pending/:lineId")
    getOldestPendingWithdrawReq(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getOldestPendingWithdrawReq(+creditLineId);
    }

    @Get("borrow/all/:lineId")
    async getAllBorrowReqByLineId(@Param("lineId") creditLineId: string) {
        const entities = await this.requestHandlerService.getAllBorrowReqByLineId(+creditLineId);

        return entities
            ? entities[0].map(ent => {
                  return {
                      ...ent,
                      borrowFiatAmount: ent.borrowFiatAmount ? formatUnits(ent.borrowFiatAmount) : null,
                      initialRiskStrategy: ent.initialRiskStrategy
                          ? formatUnits(ent.initialRiskStrategy)
                          : null,
                  };
              })
            : null;
    }
    @Get("borrow/pending/:lineId")
    getOldestPendingBorrowReq(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getOldestUnfinalizedBorrowReq(+creditLineId);
    }

    @Get("repay/all/:lineId")
    getAllRepayReqByLineId(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getAllRepayReqByLineId(+creditLineId);
    }
    @Get("repay/pending/:lineId")
    getOldestPendingRepayReq(@Param("lineId") creditLineId: string) {
        return this.requestHandlerService.getOldestPendingRepayReq(+creditLineId);
    }
}
