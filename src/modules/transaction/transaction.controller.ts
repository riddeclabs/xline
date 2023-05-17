import { Controller, Get, Param } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { ApiTags } from "@nestjs/swagger";
import { CryptoTransaction, FiatTransaction } from "../../database/entities";
import { formatUnits } from "../../common/fixed-number";

@ApiTags("Transaction")
@Controller("transaction")
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get(":creditLineId")
    async getAllTxsByLineId(@Param("creditLineId") creditLineId: string) {
        const txs = await this.transactionService.getAllTxsByLineId(+creditLineId);

        return this.serializeTxs(txs);
    }

    serializeTxs(txs: { cryptoTxs: CryptoTransaction[]; fiatTxs: FiatTransaction[] }) {
        const cryptoTxs = txs.cryptoTxs.map(ctx => {
            return {
                ...ctx,
                rawTransferAmount: ctx.rawTransferAmount.toString(),
                usdTransferAmount: ctx.usdTransferAmount.toString(),
            };
        });

        const fiatTxs = txs.fiatTxs.map(ftx => {
            return {
                ...ftx,
                rawTransferAmount: formatUnits(ftx.rawTransferAmount),
            };
        });

        return {
            cryptoTxs,
            fiatTxs,
        };
    }
}
