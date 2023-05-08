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
import { CreditLineStatus } from "../../common";
import { uint256 } from "../utils";
import { User } from "./users/user.entity";
import { UserPaymentRequisite } from "./users/user-payment-requisite.entity";
import { CollateralCurrency, DebtCurrency } from "./currencies.entity";
import { EconomicalParameters } from "./economical-parameters.entity";
import { WithdrawRequest } from "./requests/withdraw-request.entity";
import { DepositRequest } from "./requests/deposit-request.entity";
import { BorrowRequest } from "./requests/borrow-request.entity";
import { RepayRequest } from "./requests/repay-request.entity";

@Entity()
export class CreditLine {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => UserPaymentRequisite, userPaymentRequisite => userPaymentRequisite.creditLines, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_payment_requisite_id", referencedColumnName: "id" })
    userPaymentRequisiteId!: number;

    @ManyToOne(() => User, user => user.creditLines, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id", referencedColumnName: "id" })
    userId!: number;

    @ManyToOne(() => EconomicalParameters, economicalParameters => economicalParameters.creditLines)
    @JoinColumn({ name: "economical_parameters_id", referencedColumnName: "id" })
    economicalParametersId!: number;

    @ManyToOne(() => DebtCurrency, debtCurrency => debtCurrency.creditLines, { onDelete: "CASCADE" })
    @JoinColumn({ name: "debt_currency_id", referencedColumnName: "id" })
    debtCurrencyId!: number;

    @ManyToOne(() => CollateralCurrency, collateralCurrency => collateralCurrency.creditLines, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "collateral_currency_id", referencedColumnName: "id" })
    collateralCurrencyId!: number;

    @OneToMany(() => WithdrawRequest, withdrawRequest => withdrawRequest.creditLineId)
    withdrawRequests!: WithdrawRequest[];

    @OneToMany(() => DepositRequest, depositRequest => depositRequest.creditLineId)
    depositRequests!: DepositRequest[];

    @OneToMany(() => BorrowRequest, borrowRequest => borrowRequest.creditLineId)
    borrowRequests!: BorrowRequest[];

    @OneToMany(() => RepayRequest, repayRequest => repayRequest.creditLineId)
    repayRequests!: RepayRequest[];

    @Column("varchar", { name: "gateway_user_id" })
    gatewayUserId!: string;

    @Column({ name: "credit_line_status", type: "enum", enum: CreditLineStatus })
    creditLineStatus!: CreditLineStatus;

    @Column("numeric", { ...uint256(), name: "raw_collateral_amount" })
    rawCollateralAmount!: bigint;

    @Column("numeric", { ...uint256(), name: "debt_amount" })
    debtAmount!: bigint;

    @Column("numeric", { ...uint256(), name: "fee_accumulated_fiat_amount" })
    feeAccumulatedFiatAmount!: bigint;

    @Column("numeric", { ...uint256(), name: "healthy_factor" })
    healthyFactor!: bigint;

    @Column("boolean", { name: "is_liquidated" })
    isLiquidated!: boolean;

    @Column("varchar", { name: "ref_number" })
    refNumber!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
