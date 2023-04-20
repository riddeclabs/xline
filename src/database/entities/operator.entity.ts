import {
    Column,
    Index,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from "typeorm";

import { Role } from "../../common";

@Entity()
@Index(["id", "username"])
export class Operator {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: "varchar",
        length: 40,
        unique: true,
        nullable: false,
    })
    username!: string;

    @Column({
        type: "varchar",
        length: 80,
        nullable: false,
    })
    password!: string;

    @Column({
        type: "enum",
        enum: Role,
        default: Role.admin,
    })
    role!: Role;

    @CreateDateColumn({
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP(6)",
    })
    created_at!: Date;

    @UpdateDateColumn({
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP(6)",
        onUpdate: "CURRENT_TIMESTAMP(6)",
    })
    updated_at!: Date;

    @DeleteDateColumn()
    deleted_at?: Date;
}
