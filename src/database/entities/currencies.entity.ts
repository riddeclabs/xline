import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { uint256 } from "../utils";

class BaseCurrency {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { name: "symbol" })
    symbol!: string;

    @Column("numeric", { ...uint256(), name: "decimals" })
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
