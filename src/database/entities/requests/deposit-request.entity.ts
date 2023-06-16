import {
    Column,
    CreateDateColumn,
    Entity,
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
    @PrimaryGeneratedColumn()
    id!: number;

    // Foreign keys

    @Column({ name: "credit_line_id" })
    creditLineId!: number;

    @ManyToOne(() => CreditLine, creditLine => creditLine.depositRequests, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "credit_line_id" })
    creditLine!: CreditLine;

    // Child relations

    @OneToMany(() => CryptoTransaction, cryptoTransaction => cryptoTransaction.depositRequest)
    cryptoTransactions!: CryptoTransaction[];

    // Table attributes

    @Column({
        name: "deposit_request_status",
        type: "enum",
        enum: DepositRequestStatus,
        default: DepositRequestStatus.PENDING,
    })
    depositRequestStatus!: DepositRequestStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
