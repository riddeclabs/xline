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
        const cryptoTxs = await this.cryptoTransactionRepo
            .createQueryBuilder("ct")
            // FIXME: mb without `AndSelect` ?
            .leftJoinAndSelect("ct.withdraw_request_id", "wr")
            .leftJoinAndSelect("ct.deposit_request_id", "dr")
            .where("wr.credit_line_id = :creditLineId", { creditLineId })
            .orWhere("dr.credit_line_id = :creditLineId", { creditLineId })
            .getMany();

        const fiatTxs = await this.fiatTransactionRepo
            .createQueryBuilder("ft")
            .leftJoinAndSelect("ft.borrow_request_id", "br")
            .leftJoinAndSelect("ft.repay_request_id", "rr")
            .where("br.credit_line_id = :creditLineId", { creditLineId })
            .orWhere("rr.credit_line_id = :creditLineId", { creditLineId })
            .getMany();

        return {
            cryptoTxs,
            fiatTxs,
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
