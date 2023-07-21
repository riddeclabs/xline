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
    @PrimaryGeneratedColumn()
    id!: number;

    // Foreign keys

    @Column({ name: "user_payment_requisite_id" })
    userPaymentRequisiteId!: number;

    @ManyToOne(() => UserPaymentRequisite, userPaymentRequisite => userPaymentRequisite.creditLines, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_payment_requisite_id" })
    userPaymentRequisite!: UserPaymentRequisite;

    @Column({ name: "user_id" })
    userId!: number;

    @ManyToOne(() => User, user => user.creditLines, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "economical_parameters_id" })
    economicalParametersId!: number;

    @ManyToOne(() => EconomicalParameters, economicalParameters => economicalParameters.creditLines, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "economical_parameters_id" })
    economicalParameters!: EconomicalParameters;

    @Column({ name: "debt_currency_id" })
    debtCurrencyId!: number;

    @ManyToOne(() => DebtCurrency, debtCurrency => debtCurrency.creditLines, { onDelete: "CASCADE" })
    @JoinColumn({ name: "debt_currency_id" })
    debtCurrency!: DebtCurrency;

    @Column({ name: "collateral_currency_id" })
    collateralCurrencyId!: number;

    @ManyToOne(() => CollateralCurrency, collateralCurrency => collateralCurrency.creditLines, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "collateral_currency_id" })
    collateralCurrency!: CollateralCurrency;

    // Child relations

    @OneToMany(() => WithdrawRequest, withdrawRequest => withdrawRequest.creditLine)
    withdrawRequests!: WithdrawRequest[];

    @OneToMany(() => DepositRequest, depositRequest => depositRequest.creditLine)
    depositRequests!: DepositRequest[];

    @OneToMany(() => BorrowRequest, borrowRequest => borrowRequest.creditLine)
    borrowRequests!: BorrowRequest[];

    @OneToMany(() => RepayRequest, repayRequest => repayRequest.creditLine)
    repayRequests!: RepayRequest[];

    // Table attributes

    @Column("varchar", { name: "gateway_user_id" })
    gatewayUserId!: string;

    @Column({
        name: "credit_line_status",
        type: "enum",
        enum: CreditLineStatus,
        default: CreditLineStatus.INITIALIZED,
    })
    creditLineStatus!: CreditLineStatus;

    @Column("numeric", { ...uint256(), name: "raw_deposit_amount" })
    rawDepositAmount = 0n;

    @Column("numeric", { ...uint256(), name: "debt_amount" })
    debtAmount = 0n;

    @Column("numeric", { ...uint256(), name: "fee_accumulated_fiat_amount" })
    feeAccumulatedFiatAmount = 0n;

    @Column("numeric", { ...uint256(), name: "healthy_factor" })
    healthyFactor = 0n;

    @Column("boolean", { name: "is_liquidated" })
    isLiquidated!: boolean;

    @Column("varchar", { name: "ref_number", unique: true })
    refNumber!: string;

    @CreateDateColumn({ type: "timestamptz", name: "accrued_at" })
    accruedAt!: Date;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
