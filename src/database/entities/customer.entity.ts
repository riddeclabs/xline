import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

import { Role } from "../../common";

@Entity()
export class Customer {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: "varchar",
        length: 40,
        unique: true,
        nullable: false,
    })
    customerName!: string;

    @Column({
        type: "enum",
        enum: Role,
        default: Role.ADMIN,
    })
    role!: Role;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
