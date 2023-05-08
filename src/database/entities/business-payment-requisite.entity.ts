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

    @ManyToOne(() => DebtCurrency, debtCurrency => debtCurrency.businessPaymentRequisites, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "debt_currency_id", referencedColumnName: "id" })
    debtCurrencyId!: number;

    @OneToMany(() => RepayRequest, repayRequest => repayRequest.businessPaymentRequisiteId)
    repayRequests!: RepayRequest[];

    @Column("varchar", { name: "bank_name" })
    bankName!: string;

    @Column("varchar", { name: "iban" })
    iban!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
