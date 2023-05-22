import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { CreditLine } from "./credit-line.entity";
import { BusinessPaymentRequisite } from "./business-payment-requisite.entity";
import { UserPaymentRequisite } from "./users/user-payment-requisite.entity";
import { EconomicalParameters } from "./economical-parameters.entity";

export class BaseCurrency {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { name: "symbol" })
    symbol!: string;

    @Column("int", { name: "decimals" })
    decimals!: number;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}

@Entity()
export class DebtCurrency extends BaseCurrency {
    @OneToMany(() => CreditLine, creditLine => creditLine.debtCurrencyId)
    creditLines!: CreditLine[];

    @OneToMany(
        () => BusinessPaymentRequisite,
        businessPaymentRequisite => businessPaymentRequisite.debtCurrencyId
    )
    businessPaymentRequisites!: BusinessPaymentRequisite[];

    @OneToMany(() => UserPaymentRequisite, userPaymentRequisite => userPaymentRequisite.debtCurrencyId)
    userPaymentRequisites!: UserPaymentRequisite[];

    @OneToMany(() => EconomicalParameters, economicalParameters => economicalParameters.debtCurrencyId)
    economicalParameters!: EconomicalParameters[];
}

@Entity()
export class CollateralCurrency extends BaseCurrency {
    @OneToMany(() => CreditLine, creditLine => creditLine.collateralCurrencyId)
    creditLines!: CreditLine[];

    @OneToMany(
        () => EconomicalParameters,
        economicalParameters => economicalParameters.collateralCurrencyId
    )
    economicalParameters!: EconomicalParameters[];
}
