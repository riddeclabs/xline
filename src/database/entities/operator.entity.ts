import {
    Column,
    Index,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
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

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
