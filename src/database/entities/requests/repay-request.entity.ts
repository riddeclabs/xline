import { RepayRequestStatus } from "../../../common";
import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CreditLine } from "../credit-line.entity";
import { BuisinessPaymentRequisite } from "../buisiness-payment-requisite.entity";

@Entity()
export class RepayRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine)
    @JoinColumn({ name: "id" })
    creditLineId!: number;

    @ManyToOne(() => BuisinessPaymentRequisite)
    @JoinColumn({ name: "id" })
    buisinessPaymentRequisiteId!: number;

    @Column("enum", { name: "repay_request_status", enum: RepayRequestStatus })
    repayReyuestStatus!: RepayRequestStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
