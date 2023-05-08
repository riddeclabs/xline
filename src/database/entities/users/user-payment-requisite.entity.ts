import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
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
    @Index()
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, user => user.userPaymentRequisites, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id", referencedColumnName: "id" })
    userId!: number;

    @ManyToOne(() => DebtCurrency, debtCurrency => debtCurrency.userPaymentRequisites, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "debt_currency_id", referencedColumnName: "id" })
    debtCurrencyId!: number;

    @OneToMany(() => CreditLine, creditLine => creditLine.userPaymentRequisiteId)
    creditLines!: CreditLine[];

    @Column("varchar", { name: "iban" })
    iban!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
