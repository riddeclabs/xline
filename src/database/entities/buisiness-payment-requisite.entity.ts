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
import { DebtCurrency } from "./currencies.entity";
import { RepayRequest } from "./requests/repay-request.entity";

@Entity()
export class BuisinessPaymentRequisite {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => DebtCurrency, debtCurrency => debtCurrency.buisinessPaymentRequisites, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "currency_id", referencedColumnName: "id" })
    currencyId!: number;

    @OneToMany(() => RepayRequest, repayRequest => repayRequest.buisinessPaymentRequisiteId)
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
