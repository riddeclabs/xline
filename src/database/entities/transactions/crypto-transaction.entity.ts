import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
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
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => WithdrawRequest, withdrawRequest => withdrawRequest.cryptoTransactions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "withdraw_request_id", referencedColumnName: "id" })
    withdrawRequestId?: number;

    @ManyToOne(() => DepositRequest, depositRequest => depositRequest.cryptoTransactions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "deposit_request_id", referencedColumnName: "id" })
    depositRequestId?: number;

    @Column("varchar", { name: "from" })
    from!: string;

    @Column("varchar", { name: "to" })
    to!: string;

    @Column("numeric", { ...uint256(), name: "raw_transfer_amount" })
    rawTransferAmount!: bigint;

    @Column("numeric", { ...uint256(), name: "usd_transfer_amount" })
    usdTransferAmount!: bigint;

    @Column("varchar", { name: "tx_hash" })
    txHash!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
