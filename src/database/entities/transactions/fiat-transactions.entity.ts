import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { uint256 } from "../utils";
import { FiatTransactionStatus } from "../../../common";
import { BorrowRequest } from "../requests/borrow-request.entity";
import { RepayRequest } from "../requests/repay-request.entity";

@Entity()
export class FiatTransaction {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => BorrowRequest)
    @JoinColumn({ name: "id" })
    borrowRequestId?: number;

    @ManyToOne(() => RepayRequest)
    @JoinColumn({ name: "id" })
    repayRequestId?: number;

    @Column("varchar", { name: "iban_from" })
    ibanFrom!: string;

    @Column("varchar", { name: "iban_to" })
    ibanTo!: string;

    @Column("varchar", { name: "name_from" })
    nameFrom!: string;

    @Column("varchar", { name: "name_to" })
    nameTo!: string;

    @Column({ ...uint256(), name: "raw_transfer_amount" })
    rawTransferAmount!: bigint;

    @Column("enum", { name: "status", enum: FiatTransactionStatus })
    status!: FiatTransactionStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
