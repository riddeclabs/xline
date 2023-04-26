import { CreditRequestStatus } from "../../common";
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
import { uint256 } from "./utils";

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

    @Column({ name: "collateral_currency" })
    collateralCurrency!: string;

    @Column({ name: "user_id" })
    userId!: string;

    @Column({ name: "wallet_address" })
    walletAddress!: string;

    @Column("numeric", { ...uint256(), name: "requested_coll_amount" })
    requestedCollAmount!: bigint;

    @Column("numeric", { ...uint256(), name: "actual_coll_amount", default: 0n })
    actualCollAmount!: bigint;

    @Column("numeric", { ...uint256(), name: "requested_credit_amount" })
    requestedCreditAmount!: bigint;

    @Column({ name: "iban" })
    iban!: string;

    @Column("numeric", { ...uint256(), name: "apr" })
    apr!: bigint;

    @Column("numeric", { ...uint256(), name: "collateral_factor" })
    collateralFactor!: bigint;

    @Column("numeric", { ...uint256(), name: "liquidation_factor" })
    liquidationFactor!: bigint;

    @Column("numeric", { ...uint256(), name: "liquidation_fee" })
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
