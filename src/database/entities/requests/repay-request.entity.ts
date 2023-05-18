import { RepayRequestStatus } from "../../../common";
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
import { CreditLine } from "../credit-line.entity";
import { BusinessPaymentRequisite } from "../business-payment-requisite.entity";
import { FiatTransaction } from "../transactions/fiat-transactions.entity";

@Entity()
export class RepayRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine, creditLine => creditLine.repayRequests, { onDelete: "CASCADE" })
    @JoinColumn({ name: "credit_line_id", referencedColumnName: "id" })
    creditLineId!: number;

    @ManyToOne(
        () => BusinessPaymentRequisite,
        businessPaymentRequisite => businessPaymentRequisite.repayRequests,
        { onDelete: "CASCADE" }
    )
    @JoinColumn({ name: "business_payment_requisite_id", referencedColumnName: "id" })
    businessPaymentRequisiteId!: number;

    @OneToMany(() => FiatTransaction, fiatTransaction => fiatTransaction.repayRequestId)
    fiatTransactions!: FiatTransaction[];

    @Column("enum", {
        name: "repay_request_status",
        enum: RepayRequestStatus,
        default: RepayRequestStatus.VERIFICATION_PENDING,
    })
    repayRequestStatus!: RepayRequestStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
