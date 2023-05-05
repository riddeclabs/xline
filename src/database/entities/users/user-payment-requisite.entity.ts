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
import { User } from "./user.entity";
import { DebtCurrency } from "../currencies.entity";

@Entity()
export class UserPaymentRequisite {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User)
    @JoinColumn({ referencedColumnName: "id" })
    userId!: number;

    @ManyToOne(() => DebtCurrency)
    @JoinColumn({ referencedColumnName: "id" })
    currencyId!: number;

    @Column("varchar", { name: "iban" })
    iban!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
