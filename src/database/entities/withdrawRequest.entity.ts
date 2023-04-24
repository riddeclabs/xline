import { WithdrawRequestStatus } from "src/common";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CreditRequest } from "./creditRequest.entity";

@Entity()
export class WithdrawRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => CreditRequest, creditRequest => creditRequest.withdrawRequest, { cascade: true })
    @JoinColumn({ name: "credit_request_pk", referencedColumnName: "id" })
    creditRequestPk!: number;

    @Column({
        type: "enum",
        enum: WithdrawRequestStatus,
        default: WithdrawRequestStatus.WAITING,
        name: "withdraw_request_status",
    })
    withdrawRequestStatus!: WithdrawRequestStatus;

    @Column({ name: "wallet_address_to_withdraw" })
    walletAddressToWithdraw!: string;

    @Column({ name: "requested_withdraw_amount" })
    requestedWithdrawAmount!: bigint;

    @Column({ name: "actual_withdraw_amount" })
    actualWithdrawAmount!: bigint;

    @Column({ name: "tx_hash" })
    txHash!: string;

    @Column({ name: "error_message" })
    errorMessage?: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
