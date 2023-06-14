import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { CryptoCallbackDto } from "../modules/payment-processing/dto/callback.dto";
import { createHash } from "crypto";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class HashGuard implements CanActivate {
    constructor(private configService: ConfigService) {}
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        // Logic to verify the 'hash' field
        const request = context.switchToHttp().getRequest();
        const dc: CryptoCallbackDto = request.body;

        const secretKey = this.configService.get<string>("GATEWAY_SECRET_KEY");
        if (!secretKey) {
            throw new Error("Can not get GATEWAY_SECRET_KEY");
        }
        const expectedHash = this.generateExpectedHash(
            dc.id,
            dc.customerId,
            dc.amount,
            dc.currency,
            secretKey
        );
        return dc.hash === expectedHash;
    }

    private generateExpectedHash(
        id: string,
        customerId: string,
        amount: string,
        currency: string,
        secretKey: string
    ): string {
        const dataToHash = `${id}.${customerId}.${amount}.${currency}.${secretKey}`;

        const hash = createHash("sha512");
        hash.update(dataToHash);

        return hash.digest("base64");
    }
}
