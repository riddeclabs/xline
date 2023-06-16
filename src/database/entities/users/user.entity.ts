import {
    Column,
    CreateDateColumn,
    Entity,
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
    @PrimaryGeneratedColumn()
    id!: number;

    // Child relations

    @OneToMany(() => CreditLine, creditLine => creditLine.user)
    creditLines!: CreditLine[];

    @OneToMany(() => UserPaymentRequisite, userPaymentRequisite => userPaymentRequisite.user)
    userPaymentRequisites!: UserPaymentRequisite[];

    @OneToOne(() => Session, session => session.user, { onDelete: "CASCADE" })
    session?: Session;

    // Table attributes

    @Column("int", { name: "chat_id", unique: true })
    chatId!: number;

    @Column("varchar", { name: "name" })
    name!: string;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
