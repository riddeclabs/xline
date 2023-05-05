import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { DebtCurrency } from "./currencies.entity";

@Entity()
export class BuisinessPaymentRequisite {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => DebtCurrency)
    @JoinColumn({ name: "id" })
    currencyId!: number;

    @Column("varchar", { name: "bank_name" })
    bankName!: string;

    @Column("varchar", { name: "iban" })
    iban!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
