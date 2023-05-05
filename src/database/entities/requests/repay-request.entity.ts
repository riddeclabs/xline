import { RepayRequestStatus } from "../../../common";
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
import { CreditLine } from "../credit-line.entity";
import { BuisinessPaymentRequisite } from "../buisiness-payment-requisite.entity";

@Entity()
export class RepayRequest {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine)
    @JoinColumn({ referencedColumnName: "id" })
    creditLineId!: number;

    @ManyToOne(() => BuisinessPaymentRequisite)
    @JoinColumn({ referencedColumnName: "id" })
    buisinessPaymentRequisiteId!: number;

    @Column("enum", { name: "repay_request_status", enum: RepayRequestStatus })
    repayReyuestStatus!: RepayRequestStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
