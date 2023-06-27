import { Injectable } from "@nestjs/common";
import { CreateCryptoTransactionDto, CreateFiatTransactionDto } from "./dto/create-transaction.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { CryptoTransaction, FiatTransaction } from "../../database/entities";
import { Repository } from "typeorm";
import { FiatTransactionStatus } from "src/common";

@Injectable()
export class TransactionService {
    constructor(
        @InjectRepository(FiatTransaction) private fiatTransactionRepo: Repository<FiatTransaction>,
        @InjectRepository(CryptoTransaction) private cryptoTransactionRepo: Repository<CryptoTransaction>
    ) {}

    async getFiatTransactionById(id: number): Promise<FiatTransaction> {
        return this.fiatTransactionRepo
            .createQueryBuilder("ft")
            .where("ft.id = :id", { id })
            .getOneOrFail();
    }

    async getAllTxsByLineId(creditLineId: number) {
        const cryptoTxs = await this.cryptoTransactionRepo
            .createQueryBuilder("ct")
            .leftJoin("ct.withdrawRequest", "wr")
            .leftJoin("ct.depositRequest", "dr")
            .where("wr.creditLineId = :creditLineId", { creditLineId })
            .orWhere("dr.creditLineId = :creditLineId", { creditLineId })
            .getMany();

        const fiatTxs = await this.fiatTransactionRepo
            .createQueryBuilder("ft")
            .leftJoin("ft.borrowRequest", "br")
            .leftJoin("ft.repayRequest", "rr")
            .where("br.creditLineId = :creditLineId", { creditLineId })
            .orWhere("rr.creditLineId = :creditLineId", { creditLineId })
            .getMany();

        return {
            cryptoTxs,
            fiatTxs,
        };
    }

    async createFiatTransaction(
        createFiatTransactionDto: CreateFiatTransactionDto
    ): Promise<FiatTransaction> {
        const fiatTx = this.fiatTransactionRepo.create(createFiatTransactionDto);
        return this.fiatTransactionRepo.save(fiatTx);
    }

    async updateFiatTransactionStatus(
        fiatTx: FiatTransaction,
        newStatus: FiatTransactionStatus
    ): Promise<FiatTransaction> {
        await this.fiatTransactionRepo
            .createQueryBuilder()
            .update(FiatTransaction)
            .set({ status: newStatus })
            .where("id = :id", { id: fiatTx.id })
            .execute();

        return this.getFiatTransactionById(fiatTx.id);
    }

    async createCryptoTransaction(
        createCryptoTransactionDto: CreateCryptoTransactionDto
    ): Promise<CryptoTransaction> {
        const cryptoTx = this.cryptoTransactionRepo.create(createCryptoTransactionDto);
        return this.cryptoTransactionRepo.save(cryptoTx);
    }
}
