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
import { uint256 } from "../../utils";
import { BorrowRequestStatus } from "../../../common";
import { CreditLine } from "../credit-line.entity";
import { FiatTransaction } from "../transactions/fiat-transactions.entity";

@Entity()
export class BorrowRequest {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine, creditLine => creditLine.borrowRequests, { onDelete: "CASCADE" })
    @JoinColumn({ name: "credit_line_id", referencedColumnName: "id" })
    creditLineId!: number;

    @OneToMany(() => FiatTransaction, fiatTransaction => fiatTransaction.borrowRequestId)
    fiatTransactions!: FiatTransaction[];

    @Column({ name: "borrow_request_status", type: "enum", enum: BorrowRequestStatus })
    borrowRequestStatus!: BorrowRequestStatus;

    @Column("numeric", { ...uint256(), name: "borrow_fiat_amount" })
    borrowFiatAmount!: bigint | null;

    @Column("numeric", { ...uint256(), name: "initial_risk_startegy" })
    initialRiskStartegy?: bigint | null;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
