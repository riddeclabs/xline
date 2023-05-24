import { Controller, Get, Post, Body, Param, UsePipes, ValidationPipe } from "@nestjs/common";
import { PaymentRequisiteService } from "./payment-requisite.service";
import { CreateBusinessPaymentRequisiteDto } from "./dto/create-payment-requisite.dto";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("Payment requisite")
@Controller("payment-requisite")
export class PaymentRequisiteController {
    constructor(private readonly paymentRequisiteService: PaymentRequisiteService) {}

    @Get("business")
    getAllBusinessReqs() {
        return this.paymentRequisiteService.getAllBusinessPayReqs();
    }

    @Get("business/:currencyId")
    getOneBusinessReqByCurrency(@Param("currencyId") currencyId: number) {
        return this.paymentRequisiteService.getBusinessPayReqByCurrency(currencyId);
    }

    @Post("business")
    @UsePipes(ValidationPipe)
    saveBusinessRequisite(@Body() dto: CreateBusinessPaymentRequisiteDto) {
        return this.paymentRequisiteService.saveNewBusinessRequisite(dto);
    }

    @Get("user/:userId")
    getAllUserReqs(@Param("userId") userId: string) {
        return this.paymentRequisiteService.getAllPayReqByUser(+userId);
    }

    @Get("user/:requisiteId")
    getOneUserReqById(@Param("requisiteId") requisiteId: string) {
        return this.paymentRequisiteService.getUserPaymentRequisite(+requisiteId);
    }
}
