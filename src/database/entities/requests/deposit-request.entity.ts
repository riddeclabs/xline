import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { DepositRequestStatus } from "../../../common";
import { CreditLine } from "../credit-line.entity";
import { CryptoTransaction } from "../transactions/crypto-transaction.entity";

@Entity()
export class DepositRequest {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine, creditLine => creditLine.depositRequests, { onDelete: "CASCADE" })
    @JoinColumn({ name: "credit_line_id", referencedColumnName: "id" })
    creditLineId!: number;

    @OneToMany(() => CryptoTransaction, cryptoTransaction => cryptoTransaction.depositRequestId)
    cryptoTransactions!: CryptoTransaction[];

    @Column({ name: "deposit_request_status", type: "enum", enum: DepositRequestStatus })
    depositRequestStatus!: DepositRequestStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
