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
import { CollateralCurrency, DebtCurrency } from "./currencies.entity";
import { uint256 } from "../utils";
import { CreditLine } from "./credit-line.entity";

@Entity()
export class EconomicalParameters {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "collateral_currency_id" })
    collateralCurrencyId!: number;

    @ManyToOne(() => CollateralCurrency, collateralCurrency => collateralCurrency.economicalParameters, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "collateral_currency_id" })
    collateralCurrency!: CollateralCurrency;

    @Column({ name: "debt_currency_id" })
    debtCurrencyId!: number;

    @ManyToOne(() => DebtCurrency, debtCurrency => debtCurrency.economicalParameters, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "debt_currency_id" })
    debtCurrency!: DebtCurrency;

    // Child relations

    @OneToMany(() => CreditLine, creditLine => creditLine.economicalParameters, {
        onDelete: "CASCADE",
    })
    creditLines!: CreditLine[];

    // Table attributes

    @Column("numeric", { ...uint256(), name: "apr" })
    apr!: bigint;

    @Column("numeric", { ...uint256(), name: "liquidation_fee" })
    liquidationFee!: bigint;

    @Column("numeric", { ...uint256(), name: "collateral_factor" })
    collateralFactor!: bigint;

    @Column("numeric", { ...uint256(), name: "liquidation_factor" })
    liquidationFactor!: bigint;

    @Column("numeric", { ...uint256(), name: "fiat_processing_fee" })
    fiatProcessingFee!: bigint;

    @Column("numeric", { ...uint256(), name: "crypto_processing_fee" })
    cryptoProcessingFee!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
