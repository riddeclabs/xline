import {
    Column,
    Index,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
} from "typeorm";

@Entity()
@Index(["account_id", "username"])
export class Account {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({
        type: "int4",
        unique: true,
    })
    account_id!: number;

    @Column({
        type: "varchar",
        length: 40,
        nullable: false,
        default: "",
    })
    username!: string;

    @Column({
        type: "varchar",
        length: 80,
        nullable: false,
        default: "",
    })
    first_name!: string;

    @Column({
        type: "varchar",
        length: 80,
        nullable: false,
        default: "",
    })
    last_name!: string;

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
