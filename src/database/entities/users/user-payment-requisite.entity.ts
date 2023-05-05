import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { DebtCurrency } from "../currencies.entity";

@Entity()
export class UserPaymentRequisite {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: "id" })
    userId!: number;

    @ManyToOne(() => DebtCurrency)
    @JoinColumn({ name: "id" })
    currencyId!: number;

    @Column("varchar", { name: "iban" })
    iban!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
