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
import { CreditLine } from "../credit-line.entity";
import { WithdrawRequestStatus } from "../../../common";
import { uint256 } from "../../utils";
import { CryptoTransaction } from "../transactions/crypto-transaction.entity";

@Entity()
export class WithdrawRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    // Foreign keys

    @Column({ name: "credit_line_id" })
    creditLineId!: number;

    @ManyToOne(() => CreditLine, creditLine => creditLine.withdrawRequests, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "credit_line_id" })
    creditLine!: CreditLine;

    // Child relations

    @OneToMany(() => CryptoTransaction, cryptoTransaction => cryptoTransaction.withdrawRequest)
    cryptoTransactions!: CryptoTransaction[];

    // Table attributes

    @Column({
        name: "withdraw_request_status",
        type: "enum",
        enum: WithdrawRequestStatus,
        default: WithdrawRequestStatus.PENDING,
    })
    withdrawRequestStatus!: WithdrawRequestStatus;

    @Column("varchar", { name: "wallet_to_withdraw" })
    walletToWithdraw!: string;

    @Column("numeric", { ...uint256(), name: "withdraw_amount" })
    withdrawAmount!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
