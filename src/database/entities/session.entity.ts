import {
    Column,
    Entity,
    CreateDateColumn,
    UpdateDateColumn,
    PrimaryColumn,
    OneToOne,
    JoinColumn,
    Index,
} from "typeorm";
import { User } from "./users/user.entity";

@Entity()
export class Session {
    @Index({ unique: true })
    @PrimaryColumn()
    id!: number;

    @OneToOne(() => User)
    @JoinColumn({ name: "chat_id" })
    chatId!: number;

    @Column("jsonb")
    data!: Record<string, unknown>;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
