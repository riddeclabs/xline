import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { uint256 } from "./utils";

@Entity()
export class ProcessingSettings {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("numeric", { ...uint256(), name: "payment_timeout" })
    paymentTimeout!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
