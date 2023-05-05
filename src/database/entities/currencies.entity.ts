import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { uint256 } from "./utils";

class BaseCurrency {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { name: "symbol" })
    symbol!: string;

    @Column({ ...uint256(), name: "decimals" })
    decimals!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}

@Entity()
export class DebtCurrency extends BaseCurrency {}

@Entity()
export class CollateralCurrency extends BaseCurrency {}
