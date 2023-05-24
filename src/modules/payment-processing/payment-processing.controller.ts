import { Controller, Get, Post, Body, Patch, Param, UsePipes, ValidationPipe } from "@nestjs/common";
import { PaymentProcessingService } from "./payment-processing.service";
import { CreatePaymentProcessingDto } from "./dto/create-payment-processing.dto";
import { UpdatePaymentProcessingDto } from "./dto/update-payment-processing.dto";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DepositCallbackDto, WithdrawCallbackDto } from "./dto/callback.dto";

@ApiTags("Payment processing operator")
@Controller("payment-processing")
export class PaymentProcessingController {
    constructor(private readonly paymentProcessingService: PaymentProcessingService) {}

    @Post("payment-processing-operator")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Register a new payment processing operator" })
    @ApiBody({ description: "Payment processing DTO Description", type: CreatePaymentProcessingDto })
    async registerPaymentProcessingOperator(
        @Body() createPaymentProcessingDto: CreatePaymentProcessingDto
    ) {
        return this.paymentProcessingService.registerPaymentProcessingOperator(
            createPaymentProcessingDto
        );
    }

    @Patch("payment-processing-operator:id")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Update payment processing operator" })
    @ApiBody({ description: "Payment processing DTO Description", type: UpdatePaymentProcessingDto })
    async updatePaymentProcessingOperator(
        @Param("id") id: string,
        @Body() updatePaymentProcessingDto: UpdatePaymentProcessingDto
    ) {
        return this.paymentProcessingService.updatePaymentProcessingOperator(
            +id,
            updatePaymentProcessingDto
        );
    }

    @Get("payment-processing-operator")
    @ApiOperation({ summary: "Returns all payment processing operators" })
    getAllPaymentProcessingOperators() {
        return this.paymentProcessingService.getAllPaymentProcessingOperators();
    }

    @Get("payment-processing-operator:id")
    @ApiOperation({ summary: "Returns payment processing operator by ID" })
    getPaymentProcessingOperator(@Param("id") id: string) {
        return this.paymentProcessingService.getPaymentProcessingOperatorById(+id);
    }

    @Post("deposit-callback")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Gateway callback endpoint for the deposit action" })
    @ApiBody({ description: "Deposit callback DTO description", type: DepositCallbackDto })
    depositCallback(
        @Body()
        depositCallback: DepositCallbackDto
    ) {
        return this.paymentProcessingService.handleDepositCallback(depositCallback);
    }

    @Post("withdraw-callback")
    @UsePipes(ValidationPipe)
    @ApiOperation({ summary: "Gateway callback endpoint for the withdraw action" })
    @ApiBody({ description: "Withdraw callback DTO description", type: WithdrawCallbackDto })
    withdrawCallback(
        @Body()
        withdrawCallback: WithdrawCallbackDto
    ) {
        return this.paymentProcessingService.handleWithdrawCallback(withdrawCallback);
    }

    // FIXME: for test purposes only
    @Post("wallet/address/:chatId")
    async getWalletAddressByChatId(@Param("chatId") chatId: string) {
        return this.paymentProcessingService.getUserWallet(chatId, "ETH");
    }
}
