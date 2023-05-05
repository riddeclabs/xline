import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { uint256 } from "../../utils";
import { BorrowRequestStatus } from "../../../common";
import { CreditLine } from "../credit-line.entity";

@Entity()
export class BorrowRequest {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine)
    @JoinColumn({ referencedColumnName: "id" })
    creditLineId!: number;

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
