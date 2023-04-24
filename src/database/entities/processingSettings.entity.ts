import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class ProcessingSettings {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "payment_timeout" })
    paymentTimeout!: bigint;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
