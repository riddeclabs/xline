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
import { DebtCurrency } from "./currencies.entity";

@Entity()
export class BuisinessPaymentRequisite {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => DebtCurrency)
    @JoinColumn({ referencedColumnName: "id" })
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
