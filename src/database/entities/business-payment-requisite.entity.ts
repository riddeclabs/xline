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
import { DebtCurrency } from "./currencies.entity";
import { RepayRequest } from "./requests/repay-request.entity";

@Entity()
export class BusinessPaymentRequisite {
    @PrimaryGeneratedColumn()
    id!: number;

    // Foreign keys

    @Column({ name: "debt_currency_id" })
    debtCurrencyId!: number;

    @ManyToOne(() => DebtCurrency, debtCurrency => debtCurrency.businessPaymentRequisites, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "debt_currency_id" })
    debtCurrency!: DebtCurrency;

    // Child relations

    @OneToMany(() => RepayRequest, repayRequest => repayRequest.businessPaymentRequisite)
    repayRequests!: RepayRequest[];

    // Table attributes

    @Column("varchar", { name: "bank_name" })
    bankName!: string;

    @Column("varchar", { name: "iban", unique: true })
    iban!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
