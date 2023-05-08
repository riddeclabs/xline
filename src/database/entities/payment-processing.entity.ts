import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class PaymentProcessing {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { name: "url" })
    url!: string;

    @Column("varchar", { name: "origin_name" })
    originName!: string;

    @Column("varchar", { name: "callback_auth" })
    callbackAuth!: string;

    @Column("varchar", { name: "gateway_auth" })
    gatewayAuth!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
