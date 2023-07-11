import { IsEnum, IsIBAN, IsString } from "class-validator";
import { FiatTransactionStatus } from "src/common";
import { IsBigInt } from "src/decorators/class-validator-extended.decorator";

export class CreateFiatTransactionDto {
    readonly borrowRequestId!: number | null;
    readonly repayRequestId!: number | null;
    @IsIBAN()
    readonly ibanFrom!: string;
    @IsIBAN()
    readonly ibanTo!: string;
    @IsString()
    readonly nameFrom!: string;
    @IsString()
    readonly nameTo!: string;
    @IsBigInt()
    readonly rawTransferAmount!: bigint;
    @IsEnum(FiatTransactionStatus)
    readonly status!: FiatTransactionStatus;
}
