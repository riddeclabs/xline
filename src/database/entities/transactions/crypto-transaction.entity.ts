import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { WithdrawRequest } from "../requests/withdraw-request.entity";
import { DepositRequest } from "../requests/deposit-request.entity";
import { uint256 } from "../../utils";

@Entity()
export class CryptoTransaction {
    @PrimaryGeneratedColumn()
    id!: number;

    // Foreign keys

    @Column({ name: "withdraw_request_id", nullable: true })
    withdrawRequestId!: number | null;

    @ManyToOne(() => WithdrawRequest, withdrawRequest => withdrawRequest.cryptoTransactions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "withdraw_request_id" })
    withdrawRequest!: WithdrawRequest | null;

    @Column({ name: "deposit_request_id", nullable: true })
    depositRequestId!: number | null;

    @ManyToOne(() => DepositRequest, depositRequest => depositRequest.cryptoTransactions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "deposit_request_id" })
    depositRequest!: DepositRequest | null;

    // Table attributes

    @Column("numeric", { ...uint256(), name: "raw_transfer_amount" })
    rawTransferAmount!: bigint;

    @Column("numeric", { ...uint256(), name: "usd_transfer_amount" })
    usdTransferAmount!: bigint;

    @Column("varchar", { name: "tx_hash" })
    txHash!: string;

    @Column("varchar", { name: "payment_processing_tx_id" })
    paymentProcessingTxId!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
