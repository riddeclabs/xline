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
import { User } from "./user.entity";
import { DebtCurrency } from "../currencies.entity";
import { CreditLine } from "../credit-line.entity";

@Entity()
export class UserPaymentRequisite {
    @PrimaryGeneratedColumn()
    id!: number;

    // Foreign keys

    @Column({ name: "user_id" })
    userId!: number;

    @ManyToOne(() => User, user => user.userPaymentRequisites, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @Column({ name: "debt_currency_id" })
    debtCurrencyId!: number;

    @ManyToOne(() => DebtCurrency, debtCurrency => debtCurrency.userPaymentRequisites, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "debt_currency_id" })
    debtCurrency!: DebtCurrency;

    // Child relations

    @OneToMany(() => CreditLine, creditLine => creditLine.userPaymentRequisite)
    creditLines!: CreditLine[];

    // Table attributes

    @Column("varchar", { name: "iban" })
    iban!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
