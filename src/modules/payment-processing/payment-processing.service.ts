import { Injectable } from "@nestjs/common";
import { RequestResolverService } from "../request-resolver/request-resolver.service";
import { ResolveCryptoBasedRequestDto } from "../request-resolver/dto/resolve-request.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { PaymentProcessing } from "../../database/entities";
import { Repository } from "typeorm";
import axios from "axios";
import { GET_WALLET_PATH, WITHDRAWAL_PATH } from "./constants";
import { ConfigService } from "@nestjs/config";
import { CreatePaymentProcessingDto } from "./dto/create-payment-processing.dto";
import { UpdatePaymentProcessingDto } from "./dto/update-payment-processing.dto";

interface XGateWayAddressResponse {
    data: {
        address: string;
        qrCodeURL: string;
    };
    success: boolean;
}

interface XGateWayWithdrawalResponse {
    data: string;
    success: boolean;
}

@Injectable()
export class PaymentProcessingService {
    constructor(
        @InjectRepository(PaymentProcessing)
        private paymentProcessingRepo: Repository<PaymentProcessing>,
        private requestResolver: RequestResolverService,
        private configService: ConfigService
    ) {}

    async registerPaymentProcessingOperator(dto: CreatePaymentProcessingDto) {
        const processingOperator = this.paymentProcessingRepo.create(dto);
        return this.paymentProcessingRepo.save(processingOperator);
    }

    async updatePaymentProcessingOperator(id: number, dto: UpdatePaymentProcessingDto) {
        return this.paymentProcessingRepo.update(id, dto);
    }

    async getAllPaymentProcessingOperators() {
        return this.paymentProcessingRepo.find();
    }

    async getPaymentProcessingOperatorById(id: number) {
        return this.paymentProcessingRepo.findOneByOrFail({ id });
    }

    // Returns last registered payment getaway
    async getCurrentPaymentGateway() {
        return this.paymentProcessingRepo.findOne({
            order: {
                createdAt: "desc",
            },
        });
    }

    // Return user wallet address.
    // Create a new one if user already has been registered in gateway system,
    // if not, returns already existed wallet address.
    async getUserWallet(chatId: string, currencySymbol: string) {
        const paymentGateway = await this.getCurrentPaymentGateway();

        if (!paymentGateway) {
            throw new Error("Payment gateway has not been registered");
        }

        const baseUrl = paymentGateway.url;
        const apiKey = this.configService.get("GATEWAY_API_KEY");
        const authToken = this.configService.get("GATEWAY_AUTH_TOKEN");

        let resData: XGateWayAddressResponse;
        try {
            const res = await axios.post(
                baseUrl + GET_WALLET_PATH,
                { customerId: chatId, currency: currencySymbol },
                {
                    withCredentials: true,
                    headers: {
                        "x-api-key": apiKey,
                        Cookie: authToken,
                    },
                }
            );
            resData = res.data;
        } catch (e) {
            throw e;
        }
        if (!resData.success || !resData.data.address) {
            throw new Error("Unsuccessful wallet request");
        }
        return resData.data.address;
    }

    async sendWithdrawRequest(
        currencySymbol: string,
        withdrawAmount: string,
        addressToWithdraw: string,
        chatId: string
    ) {
        const paymentGateway = await this.getCurrentPaymentGateway();
        if (!paymentGateway) {
            throw new Error("Payment gateway has not been registered");
        }

        const baseUrl = paymentGateway.url;
        const apiKey = this.configService.get("GATEWAY_API_KEY");
        const authToken = this.configService.get("GATEWAY_AUTH_TOKEN");

        let resData: XGateWayWithdrawalResponse;
        try {
            const res = await axios.post(
                baseUrl + WITHDRAWAL_PATH,
                {
                    customerId: chatId,
                    amount: withdrawAmount,
                    address: addressToWithdraw,
                    currency: currencySymbol,
                },
                {
                    withCredentials: true,
                    headers: {
                        "x-api-key": apiKey,
                        Cookie: authToken,
                    },
                }
            );
            resData = res.data;
        } catch (e) {
            throw e;
        }
        if (!resData.success) {
            throw new Error("Unsuccessful withdrawal request");
        }
    }

    // Callback handler for the deposit action
    async handleDepositCallback(depositCallback: {
        from: string;
        to: string;
        txHash: string;
        rawAmount: string;
        usdAmount: string;
    }) {
        const depositReqDto = Object.assign(new ResolveCryptoBasedRequestDto(), depositCallback);
        await this.requestResolver.resolveDepositRequest(depositReqDto);
    }

    // Callback handler for the withdrawal action
    async handleWithdrawCallback(depositCallback: {
        from: string;
        to: string;
        txHash: string;
        rawAmount: string;
        usdAmount: string;
    }) {
        const withdrawReqDto = Object.assign(new ResolveCryptoBasedRequestDto(), depositCallback);
        await this.requestResolver.resolveWithdrawRequest(withdrawReqDto);
    }
}
