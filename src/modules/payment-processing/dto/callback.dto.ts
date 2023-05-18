import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

abstract class CallbackDto {
    @IsString()
    @ApiProperty({
        description: "Address tx has been sent from",
        example: "0xF9a46555cbd3bc5461BD09c2E77e24B630476Dc3",
    })
    readonly from!: string;
    @IsString()
    @ApiProperty({
        description: "Address tx has been sent to",
        example: "0x60A1b4ECfd1390F4c318774899D19f907aa91aca",
    })
    readonly to!: string;
    @IsString()
    @ApiProperty({
        description: "Hash of the transaction",
        example: "0x05138d05766f42db89491979737e902fa1172e94aa7802330bc9c9a69b90974e",
    })
    readonly txHash!: string;
    @IsString()
    @ApiProperty({
        description: "Actually transferred amount in original accuracy. 1 ETH -> 1 * 10^18",
        example: "1000000000000000000",
    })
    readonly rawAmount!: string;
    @IsString()
    @ApiProperty({
        description: "Actually transferred amount in usd. Scaled by 1e18. 100 USD -> 100 * 10^18",
        example: "1000000000000000000",
    })
    readonly usdAmount!: string;
}

export class DepositCallbackDto extends CallbackDto {}
export class WithdrawCallbackDto extends CallbackDto {}
