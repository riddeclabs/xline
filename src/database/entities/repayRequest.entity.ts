import { RepayRequestStatus } from "src/common";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CreditLineState } from "./creditLineState.entity";

@Entity()
export class RepayRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: "enum",
        enum: RepayRequestStatus,
        default: RepayRequestStatus.FIAT_REPAY_WAITING,
        name: "repay_request_status",
    })
    repayRequestStatus!: RepayRequestStatus;

    @OneToOne(() => CreditLineState, creditLineState => creditLineState.repayRequest, { cascade: true })
    @JoinColumn({ name: "credit_line_state_pk", referencedColumnName: "id" })
    creditLineStatePk!: number;

    @Column({ name: "actual_repay_request_amount" })
    actualRepayRequestAmount!: bigint;

    @Column({ name: "tx_hash" })
    txHash!: string;

    @Column({ name: "actual_wallet_address" })
    actualWaletAddress!: string;

    @Column({ name: "requested_wallet_address" })
    requestedWalletAddress!: string;

    @Column({ name: "requested_repay_amount" })
    requestedRepayAmount!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
