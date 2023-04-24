import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class EconomicModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "apr" })
    apr!: bigint;

    @Column({ name: "collateral_factor" })
    collateralFactor!: bigint;

    @Column({ name: "liquidation_factor" })
    liquidationFactor!: bigint;

    @Column({ name: "liquidation_fee" })
    liquidationFee!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
