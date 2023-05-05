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
import { DepositRequestStatus } from "../../../common";
import { CreditLine } from "../credit-line.entity";

@Entity()
export class DepositRequest {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine)
    @JoinColumn({ referencedColumnName: "id" })
    creditLineId!: number;

    @Column({ name: "deposit_request_status", type: "enum", enum: DepositRequestStatus })
    depositRequestStatus!: DepositRequestStatus;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
