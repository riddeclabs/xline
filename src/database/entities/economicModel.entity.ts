import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { uint256 } from "./utils";

@Entity()
export class EconomicModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("numeric", { ...uint256(), name: "apr" })
    apr!: bigint;

    @Column("numeric", { ...uint256(), name: "collateral_factor" })
    collateralFactor!: bigint;

    @Column("numeric", { ...uint256(), name: "liquidation_factor" })
    liquidationFactor!: bigint;

    @Column("numeric", { ...uint256(), name: "liquidation_fee" })
    liquidationFee!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
