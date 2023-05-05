import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CreditLineStatus } from "../../common";
import { uint256 } from "./utils";
import { User } from "./users/user.entity";
import { UserPaymentRequisite } from "./users/user-payment-requisite.entity";
import { CollateralCurrency, DebtCurrency } from "./currencies.entity";
import { EconomicalParameters } from "./economical-parameters.entity";

@Entity()
export class CreditLine {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => UserPaymentRequisite)
    @JoinColumn({ name: "id" })
    userPaymentRequisiteId!: UserPaymentRequisite;

    @ManyToOne(() => User)
    @JoinColumn({ name: "id" })
    userId!: User;

    @ManyToOne(() => EconomicalParameters)
    @JoinColumn({ name: "id" })
    economicalParamId!: EconomicalParameters;

    @ManyToOne(() => DebtCurrency)
    @JoinColumn({ name: "id" })
    debtCurrencyId!: DebtCurrency;

    @ManyToOne(() => CollateralCurrency)
    @JoinColumn({ name: "id" })
    collateralCurrencyId!: CollateralCurrency;

    @Column("enum", { name: "credit_line_status", enum: CreditLineStatus })
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
