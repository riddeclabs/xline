import { Injectable } from "@nestjs/common";
import { RequestResolverService } from "../request-resolver/request-resolver.service";
import { ResolveCryptoBasedRequestDto } from "../request-resolver/dto/resolve-request.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { PaymentProcessing } from "../../database/entities";
import { Repository } from "typeorm";
import axios, { AxiosError } from "axios";
import { CallbackTransactionStatus, GET_WALLET_PATH, WITHDRAWAL_PATH } from "./constants";
import { ConfigService } from "@nestjs/config";
import { CreatePaymentProcessingDto } from "./dto/create-payment-processing.dto";
import { UpdatePaymentProcessingDto } from "./dto/update-payment-processing.dto";
import { CryptoCallbackDto } from "./dto/callback.dto";
import { XGWValidationErrorResponse } from "./payment-processing.types";

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
        return this.paymentProcessingRepo
            .createQueryBuilder("paymentProcessing")
            .where("paymentProcessing.id > :id", { id: 0 })
            .orderBy("paymentProcessing.createdAt", "DESC")
            .getOne();
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
        chatId: number
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
                    customerId: chatId.toString(),
                    amount: Number(withdrawAmount), // FIXME: After XGW fix data structure, should be `string` instead of `number`
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
            if (e instanceof AxiosError) {
                const responseData = e.response?.data as XGWValidationErrorResponse;
                console.error(`${e.message}. Reason: ${responseData?.errors[0]?.message}`);
            }
            throw e;
        }
        if (!resData.success) {
            console.error("Response data:", resData);
            throw new Error("Unsuccessful withdrawal request");
        }
    }

    // Callback handler for the deposit action
    async handleCryptoCallback(dto: CryptoCallbackDto) {
        const depositReqDto = Object.assign(new ResolveCryptoBasedRequestDto(), {
            txHash: dto.txHash,
            paymentProcessingTxId: dto.id,
            rawTransferAmount: dto.amount,
            usdTransferAmount: dto.usd.toString(),
            collateralSymbol: dto.currency,
            chatId: dto.customerId,
            callbackType: dto.type,
        });

        // TODO: When XGW implements flow for FAILED txs, we will need to handle this case
        //  WARNING! Currently, if transaction is failed, we get `CONFIRMED` anyway
        if (dto.status !== CallbackTransactionStatus.CONFIRMED) {
            return;
        }

        await this.requestResolver.resolveCryptoRequest(depositReqDto);

        return {
            success: true,
        };
    }
}
