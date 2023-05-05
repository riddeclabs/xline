import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CollateralCurrency, DebtCurrency } from "./currencies.entity";
import { uint256 } from "./utils";

@Entity()
export class EconomicalParameters {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CollateralCurrency)
    @JoinColumn({ name: "id" })
    collateralCurrencyId!: number;

    @ManyToOne(() => DebtCurrency)
    @JoinColumn({ name: "id" })
    debtCurrencyId!: number;

    @Column({ ...uint256(), name: "apr" })
    apr!: bigint;

    @Column({ ...uint256(), name: "liquidation_fee" })
    liquidationFee!: bigint;

    @Column({ ...uint256(), name: "collateral_factor" })
    collateralFactor!: bigint;

    @Column({ ...uint256(), name: "liquidation_Factor" })
    liquidationFactor!: bigint;

    @Column({ ...uint256(), name: "fiat_processing_fee" })
    fiatProcessingFee!: bigint;

    @Column({ ...uint256(), name: "crypto_processing_fee" })
    cryptoProcessingFee!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
