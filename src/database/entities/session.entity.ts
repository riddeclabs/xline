import {
    Column,
    Entity,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    PrimaryColumn,
} from "typeorm";

@Entity()
export class Session {
    @PrimaryColumn()
    id!: number;

    @Column("jsonb")
    data!: Record<string, unknown>;

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
