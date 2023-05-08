import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { uint256 } from "../../utils";
import { FiatTransactionStatus } from "../../../common";
import { BorrowRequest } from "../requests/borrow-request.entity";
import { RepayRequest } from "../requests/repay-request.entity";

@Entity()
export class FiatTransaction {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => BorrowRequest, borrowRequest => borrowRequest.fiatTransactions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "borrow_request_id", referencedColumnName: "id" })
    borrowRequestId!: number | null;

    @ManyToOne(() => RepayRequest, repayRequest => repayRequest.fiatTransactions, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "repay_request_id", referencedColumnName: "id" })
    repayRequestId!: number | null;

    @Column("varchar", { name: "iban_from" })
    ibanFrom!: string;

    @Column("varchar", { name: "iban_to" })
    ibanTo!: string;

    @Column("varchar", { name: "name_from" })
    nameFrom!: string;

    @Column("varchar", { name: "name_to" })
    nameTo!: string;

    @Column("numeric", { ...uint256(), name: "raw_transfer_amount" })
    rawTransferAmount!: bigint;

    @Column({ name: "status", type: "enum", enum: FiatTransactionStatus })
    status!: FiatTransactionStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
