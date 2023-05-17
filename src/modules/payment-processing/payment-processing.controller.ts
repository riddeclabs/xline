import { Controller, Get, Post, Body, Patch, Param } from "@nestjs/common";
import { PaymentProcessingService } from "./payment-processing.service";
import { CreatePaymentProcessingDto } from "./dto/create-payment-processing.dto";
import { UpdatePaymentProcessingDto } from "./dto/update-payment-processing.dto";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Payment processing operator")
@Controller("payment-processing")
export class PaymentProcessingController {
    constructor(private readonly paymentProcessingService: PaymentProcessingService) {}

    @Post("payment-processing-operator")
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
    @ApiOperation({ summary: "Update payment processing operator" })
    @ApiBody({ description: "Payment processing DTO Description", type: CreatePaymentProcessingDto })
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
    getAllPaymentProcessingOperators() {
        return this.paymentProcessingService.getAllPaymentProcessingOperators();
    }

    @Get("payment-processing-operator:id")
    getPaymentProcessingOperator(@Param("id") id: string) {
        return this.paymentProcessingService.getPaymentProcessingOperatorById(+id);
    }

    @Post("deposit-callback")
    depositCallback(
        @Body()
        depositCallback: {
            from: string;
            to: string;
            txHash: string;
            rawAmount: string;
            usdAmount: string;
        }
    ) {
        return this.paymentProcessingService.handleDepositCallback(depositCallback);
    }

    @Post("withdraw-callback")
    withdrawCallback(
        @Body()
        withdrawCallback: {
            from: string;
            to: string;
            txHash: string;
            rawAmount: string;
            usdAmount: string;
        }
    ) {
        return this.paymentProcessingService.handleWithdrawCallback(withdrawCallback);
    }

    @Post("wallet/address/:chatId")
    async getWalletAddressByChatId(@Param("chatId") chatId: string) {
        return this.paymentProcessingService.getUserWallet(chatId, "ETH");
    }
}
