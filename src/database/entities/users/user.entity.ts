import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CreditLine } from "../credit-line.entity";
import { UserPaymentRequisite } from "./user-payment-requisite.entity";
import { Session } from "../session.entity";

@Entity()
export class User {
    @Index()
    @PrimaryGeneratedColumn()
    id!: number;

    @OneToMany(() => CreditLine, creditLine => creditLine.userId)
    creditLines!: CreditLine[];

    @OneToMany(() => UserPaymentRequisite, userPaymentRequisite => userPaymentRequisite.userId)
    userPaymentRequisites!: UserPaymentRequisite[];

    @OneToOne(() => Session, session => session.userId, { onDelete: "CASCADE" })
    session?: Session;

    @Column("int", { name: "chat_id", unique: true })
    chatId!: number;

    @Column("varchar", { name: "name" })
    name!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
