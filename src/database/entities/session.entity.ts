import {
    Column,
    Entity,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn,
    OneToOne,
    JoinColumn,
} from "typeorm";
import { User } from "./users/user.entity";

@Entity()
export class Session {
    @PrimaryColumn()
    id!: number;

    // Foreign keys

    @Column({ name: "user_id", nullable: true })
    userId!: number | null;

    @OneToOne(() => User, user => user.session, { onDelete: "CASCADE" })
    @JoinColumn({ name: "user_id" })
    user!: User | null;

    // Table attributes

    @Column("jsonb")
    data!: Record<string, unknown>;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
