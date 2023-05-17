import { Injectable } from "@nestjs/common";
import { CreateCryptoTransactionDto, CreateFiatTransactionDto } from "./dto/create-transaction.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CryptoTransaction, FiatTransaction } from "../../database/entities";
import { Repository } from "typeorm";

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(FiatTransaction) private fiatTransactionRepo: Repository<FiatTransaction>,
        @InjectRepository(CryptoTransaction) private cryptoTransactionRepo: Repository<CryptoTransaction>
    ) {}

    async getAllTxsByLineId(creditLineId: number) {
        // FIXME: double check the requests FK (camelCase vs snake_case)
        const cryptoTxs = await this.cryptoTransactionRepo
            .createQueryBuilder("ct")
            // FIXME: mb without `AndSelect` ?
            .leftJoinAndSelect("ct.withdrawRequestId", "wr")
            .leftJoinAndSelect("ct.depositRequestId", "dr")
            .where("wr.creditLineId = :creditLineId", { creditLineId })
            .orWhere("dr.creditLineId = :creditLineId", { creditLineId })
            .getMany();

        const fiatTxs = await this.fiatTransactionRepo
            .createQueryBuilder("ft")
            .leftJoinAndSelect("ft.borrowRequestId", "br")
            .leftJoinAndSelect("ft.repayRequestId", "rr")
            .where("br.creditLineId = :creditLineId", { creditLineId })
            .orWhere("rr.creditLineId = :creditLineId", { creditLineId })
            .getMany();

        return {
            cryptoTxs: cryptoTxs,
            fiatTxs: fiatTxs,
        };
    }

    async createFiatTransaction(createFiatTransactionDto: CreateFiatTransactionDto) {
        const fiatTx = this.fiatTransactionRepo.create(createFiatTransactionDto);
        return this.fiatTransactionRepo.save(fiatTx);
    }

    async createCryptoTransaction(createCryptoTransactionDto: CreateCryptoTransactionDto) {
        const cryptoTx = this.cryptoTransactionRepo.create(createCryptoTransactionDto);
        return this.cryptoTransactionRepo.save(cryptoTx);
    }
}
