import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

@Entity()
export class User {
    @Index({ unique: true })
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("int", { name: "chat_id" })
    chat_id!: number;

    @Column("varchar", { name: "name" })
    name!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
