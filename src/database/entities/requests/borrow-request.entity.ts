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
import { BorrowRequestStatus } from "../../../common";
import { CreditLine } from "../credit-line.entity";

@Entity()
export class BorrowRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine)
    @JoinColumn({ name: "id" })
    creditLineId!: number;

    @Column("enum", { name: "borrow_request_status", enum: BorrowRequestStatus })
    borrowRequestStatus!: BorrowRequestStatus;

    @Column({ ...uint256(), name: "borrow_fiat_amount" })
    borrowFiatAmount!: bigint | null;

    @Column({ ...uint256(), name: "initial_risk_startegy" })
    initialRiskStartegy?: bigint | null;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
