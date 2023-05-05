import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { DepositRequestStatus } from "../../../common";
import { CreditLine } from "../credit-line.entity";

@Entity()
export class DepositRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine)
    @JoinColumn({ name: "id" })
    creditLineId!: number;

    @Column("enum", { name: "deposit_request_status", enum: DepositRequestStatus })
    depositRequestStatus!: DepositRequestStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
