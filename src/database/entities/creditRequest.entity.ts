import { CreditRequestStatus } from "src/common";
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CreditLineState } from "./creditLineState.entity";
import { WithdrawRequest } from "./withdrawRequest.entity";

@Entity()
export class CreditRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => CreditLineState, creditLineState => creditLineState.creditRequestPk, {
        cascade: true,
    })
    creditLineState?: CreditLineState;

    @OneToOne(() => WithdrawRequest, withdrawRequest => withdrawRequest.creditRequestPk, {
        cascade: true,
    })
    withdrawRequest?: WithdrawRequest;

    @Column({
        type: "enum",
        enum: CreditRequestStatus,
        default: CreditRequestStatus.DEPOSIT_WAITING,
        name: "credit_request_status",
    })
    creditRequestStatus!: CreditRequestStatus;

    @Column({ name: "wallet_address" })
    walletAddress!: string;

    @Column({ name: "requested_coll_amount" })
    requestedCollAmount!: bigint;

    @Column({ name: "actual_coll_amount" })
    actualCollAmount!: bigint;

    @Column({ name: "requested_credit_amount" })
    requestedCreditAmount!: bigint;

    @Column({ name: "iban" })
    iban!: string;

    @Column({ name: "apr" })
    apr!: bigint;

    @Column({ name: "collateral_factor" })
    collateralFactor!: bigint;

    @Column({ name: "liquidation_factor" })
    liquidationFactor!: bigint;

    @Column({ name: "liquidation_fee" })
    liquidationFee!: bigint;

    @Column({ name: "approve_status" })
    approveStatus!: string;

    @Column({ name: "rejected_reason" })
    rejectedReason?: string;

    @Column({ name: "is_fiat_sent" })
    isFiatSent!: boolean;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
