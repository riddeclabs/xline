import { RepayRequestStatus } from "../../../common";
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
import { CreditLine } from "../credit-line.entity";
import { BuisinessPaymentRequisite } from "../buisiness-payment-requisite.entity";
import { FiatTransaction } from "../transactions/fiat-transactions.entity";

@Entity()
export class RepayRequest {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine, creditLine => creditLine.repayRequests, { onDelete: "CASCADE" })
    @JoinColumn({ name: "credit_line_id", referencedColumnName: "id" })
    creditLineId!: number;

    @ManyToOne(
        () => BuisinessPaymentRequisite,
        buisinessPaymentRequisite => buisinessPaymentRequisite.repayRequests,
        { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "buisiness_payment_requisite_id", referencedColumnName: "id" })
    buisinessPaymentRequisiteId!: number;

    @OneToMany(() => FiatTransaction, fiatTransaction => fiatTransaction.repayRequestId)
    fiatTransactions!: FiatTransaction[];

    @Column("enum", { name: "repay_request_status", enum: RepayRequestStatus })
    repayReyuestStatus!: RepayRequestStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
