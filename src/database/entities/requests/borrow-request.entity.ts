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
import { uint256OrNull } from "../../utils";
import { BorrowRequestStatus } from "../../../common";
import { CreditLine } from "../credit-line.entity";
import { FiatTransaction } from "../transactions/fiat-transactions.entity";

@Entity()
export class BorrowRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    // Foreign keys

    @Column({ name: "credit_line_id" })
    creditLineId!: number;

    @ManyToOne(() => CreditLine, creditLine => creditLine.borrowRequests, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "credit_line_id" })
    creditLine!: CreditLine;

    // Child relations

    @OneToMany(() => FiatTransaction, fiatTransaction => fiatTransaction.borrowRequest)
    fiatTransactions!: FiatTransaction[];

    // Table attributes

    @Column({
        name: "borrow_request_status",
        type: "enum",
        enum: BorrowRequestStatus,
        default: BorrowRequestStatus.VERIFICATION_PENDING,
    })
    borrowRequestStatus!: BorrowRequestStatus;

    @Column("numeric", { ...uint256OrNull(), name: "borrow_fiat_amount", nullable: true })
    borrowFiatAmount!: bigint | null;

    @Column("numeric", { ...uint256OrNull, name: "initial_risk_strategy", nullable: true })
    initialRiskStrategy!: bigint | null;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
