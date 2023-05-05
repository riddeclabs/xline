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
import { WithdrawRequestStatus } from "../../../common";
import { uint256 } from "../../utils";

@Entity()
export class WithdrawRequest {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => CreditLine)
    @JoinColumn({ referencedColumnName: "id" })
    creditLineId!: number;

    @Column({ name: "withdraw_request_status", type: "enum", enum: WithdrawRequestStatus })
    withdrawRequestStatus!: WithdrawRequestStatus;

    @Column("varchar", { name: "wallet_to_withdraw" })
    walletToWithdraw!: string;

    @Column("numeric", { ...uint256(), name: "withdraw_amount" })
    withdrawAmount!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
