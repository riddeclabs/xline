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
import { CreditLine } from "../credit-line.entity";
import { WithdrawRequestStatus } from "../../../common";
import { uint256 } from "../../utils";
import { CryptoTransaction } from "../transactions/crypto-transaction.entity";

@Entity()
export class WithdrawRequest {
    @Index()
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine, creditLine => creditLine.withdrawRequests, { onDelete: "CASCADE" })
    @JoinColumn({ name: "credit_line_id", referencedColumnName: "id" })
    creditLineId!: number;

    @OneToMany(() => CryptoTransaction, cryptoTransaction => cryptoTransaction.withdrawRequestId)
    cryptoTransactions!: CryptoTransaction[];

    @Column({
        name: "withdraw_request_status",
        type: "enum",
        enum: WithdrawRequestStatus,
        default: WithdrawRequestStatus.VERIFICATION_PENDING,
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
