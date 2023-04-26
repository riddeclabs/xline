import { CreditLineStateStatus } from "../../common";
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
import { RepayRequest } from "./repayRequest.entity";
import { uint256 } from "./utils";

@Entity()
export class CreditLineState {
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToOne(() => CreditRequest, creditRequest => creditRequest.creditLineState)
    @JoinColumn({ name: "credit_request_pk", referencedColumnName: "id" })
    creditRequestPk!: number;

    @OneToOne(() => RepayRequest, repayRequest => repayRequest.creditLineStatePk, { cascade: true })
    repayRequest?: RepayRequest;

    @Column({
        type: "enum",
        enum: CreditLineStateStatus,
        default: CreditLineStateStatus.ACTIVE,
        name: "credit_line_status",
    })
    creditLineStateStatus!: CreditLineStateStatus;

    @Column("numeric", { ...uint256(), name: "raw_collateral_amount" })
    rawCollateralAmount!: bigint;

    @Column("numeric", { ...uint256(), name: "fee_accumulated_fiat" })
    feeAccumulatedFiat!: bigint;

    @Column("numeric", { ...uint256(), name: "health_factor" })
    healthFactor!: bigint;

    @Column("numeric", { ...uint256(), name: "debt_amount_fiat" })
    debtAmountFiat!: bigint;

    @Column({ name: "is_liquidated" })
    isLiquidated!: boolean;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
