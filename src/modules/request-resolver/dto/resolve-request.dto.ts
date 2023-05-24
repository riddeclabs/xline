import { IsNumber, IsString } from "class-validator";

export class ResolveCryptoBasedRequestDto {
    @IsNumber()
    requestId!: number;
    @IsString()
    from!: string;
    @IsString()
    to!: string;
    @IsString()
    rawTransferAmount!: string;
    @IsString()
    usdTransferAmount!: string;
    @IsString()
    txHash!: string;
}

export class ResolveFiatBasedRequestDto {
    @IsNumber()
    requestId!: number;
    @IsString()
    ibanFrom!: string;
    @IsString()
    ibanTo!: string;
    @IsString()
    nameFrom!: string;
    @IsString()
    nameTo!: string;
    @IsString()
    rawTransferAmount!: string;
    @IsString()
    status!: string;
}
