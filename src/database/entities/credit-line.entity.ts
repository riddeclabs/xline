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
import { CreditLineStatus } from "../../common";
import { uint256 } from "../utils";
import { User } from "./users/user.entity";
import { UserPaymentRequisite } from "./users/user-payment-requisite.entity";
import { CollateralCurrency, DebtCurrency } from "./currencies.entity";
import { EconomicalParameters } from "./economical-parameters.entity";

@Entity()
export class CreditLine {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => UserPaymentRequisite)
    @JoinColumn({ referencedColumnName: "id" })
    userPaymentRequisiteId!: UserPaymentRequisite;

    @ManyToOne(() => User)
    @JoinColumn({ referencedColumnName: "id" })
    userId!: User;

    @ManyToOne(() => EconomicalParameters)
    @JoinColumn({ referencedColumnName: "id" })
    economicalParametersId!: EconomicalParameters;

    @ManyToOne(() => DebtCurrency)
    @JoinColumn({ referencedColumnName: "id" })
    debtCurrencyId!: DebtCurrency;

    @ManyToOne(() => CollateralCurrency)
    @JoinColumn({ referencedColumnName: "id" })
    collateralCurrencyId!: CollateralCurrency;

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
