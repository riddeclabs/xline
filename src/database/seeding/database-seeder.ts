import { DataSource } from "typeorm";
import entities, {
    BusinessPaymentRequisite,
    EconomicalParameters,
    Operator,
    PaymentProcessing,
} from "../entities";
import migrations from "../migrations";
import { BaseCurrency, CollateralCurrency, DebtCurrency } from "../entities/currencies.entity";
import { parseUnits } from "../../common/fixed-number";
import { Role } from "../../common";

(async () => {
    const dataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "0.0.0.0",
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "xline",
        logging: false,
        logger: "advanced-console",
        entities: entities,
        migrations: migrations,
    });
    await dataSource.initialize();
    await dataSource.runMigrations();

    await new DatabaseSeeder(dataSource)
        .addCollateralCurrency({
            symbol: "ETH",
            decimals: 18,
        })
        .addCollateralCurrency({
            symbol: "BTC",
            decimals: 8,
        })
        .addDebtCurrency({
            symbol: "USD",
            decimals: 18,
        })
        .addEconomicalParameters({
            collateralCurrency: "ETH",
            debtCurrency: "USD",
            apr: 0.13,
            liquidationFee: 0.1,
            collateralFactor: 0.7,
            liquidationFactor: 0.8,
            minFiatProcessingFee: 10,
            fiatProcessingFee: 0.005,
            minCryptoProcessingFeeFiat: 11,
            cryptoProcessingFee: 0.006,
        })
        .addEconomicalParameters({
            collateralCurrency: "BTC",
            debtCurrency: "USD",
            apr: 0.12,
            liquidationFee: 0.11,
            collateralFactor: 0.72,
            liquidationFactor: 0.82,
            minFiatProcessingFee: 12,
            fiatProcessingFee: 0.02,
            minCryptoProcessingFeeFiat: 13,
            cryptoProcessingFee: 0.015,
        })
        .addBusinessPaymentRequisites({
            debtCurrency: "USD",
            bankName: "Mad Dogs, Skipper and Seagull Inc.",
            iban: "SO061000001123123456789",
        })
        .addPaymentProcessing({
            url: "https://api.demo.xgateway.tech/api/v1",
        })
        .addOperator({
            username: "Vasia",
            role: Role.ADMIN,
            password: "$2b$10$dmFvvPqvXZb4bFdPMyxznOLnFS343vOh4eOcsQB1f1pwIvZ6O/HMy",
        })
        .seed();

    await dataSource.destroy();
})();

class DatabaseSeeder {
    private dataSource: DataSource;
    private collateralCurrencies: Partial<CollateralCurrency>[] = [];
    private debtCurrencies: Partial<BaseCurrency>[] = [];
    private economicalParameters: Partial<EconomicalParameters>[] = [];
    private businessPaymentRequisites: Partial<BusinessPaymentRequisite>[] = [];
    private paymentProcessing: Partial<PaymentProcessing>[] = [];
    private operators: Partial<Operator>[] = [];

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
    }

    addCollateralCurrency(params: { symbol: string; decimals: number }): DatabaseSeeder {
        this.collateralCurrencies.push(params);
        return this;
    }

    addDebtCurrency(params: { symbol: string; decimals: number }): DatabaseSeeder {
        this.debtCurrencies.push(params);
        return this;
    }

    addEconomicalParameters(params: {
        collateralCurrency: string;
        debtCurrency: string;
        apr: number;
        liquidationFee: number;
        collateralFactor: number;
        liquidationFactor: number;
        minFiatProcessingFee: number;
        fiatProcessingFee: number;
        minCryptoProcessingFeeFiat: number;
        cryptoProcessingFee: number;
    }): DatabaseSeeder {
        const collateralCurrencyId = this.getCurrencyId(
            params.collateralCurrency,
            this.collateralCurrencies
        );
        const debtCurrencyId = this.getCurrencyId(params.debtCurrency, this.debtCurrencies);

        this.economicalParameters.push({
            collateralCurrencyId: collateralCurrencyId,
            debtCurrencyId: debtCurrencyId,
            apr: parseUnits(params.apr.toString()),
            liquidationFee: parseUnits(params.liquidationFee.toString()),
            collateralFactor: parseUnits(params.collateralFactor.toString()),
            liquidationFactor: parseUnits(params.liquidationFactor.toString()),
            minFiatProcessingFee: parseUnits(params.minFiatProcessingFee.toString()),
            fiatProcessingFee: parseUnits(params.fiatProcessingFee.toString()),
            minCryptoProcessingFeeFiat: parseUnits(params.minCryptoProcessingFeeFiat.toString()),
            cryptoProcessingFee: parseUnits(params.cryptoProcessingFee.toString()),
        });
        return this;
    }

    addBusinessPaymentRequisites(params: {
        debtCurrency: string;
        bankName: string;
        iban: string;
    }): DatabaseSeeder {
        const debtCurrencyId = this.getCurrencyId(params.debtCurrency, this.debtCurrencies);

        this.businessPaymentRequisites.push({
            debtCurrencyId: debtCurrencyId,
            bankName: params.bankName,
            iban: params.iban,
        });
        return this;
    }

    addPaymentProcessing(params: { url: string }): DatabaseSeeder {
        this.paymentProcessing.push({ ...params });
        return this;
    }

    addOperator(params: { username: string; role: Role; password: string }): DatabaseSeeder {
        this.operators.push({ ...params });
        return this;
    }

    async seed() {
        for (const cc of this.collateralCurrencies) {
            await this.dataSource.getRepository(CollateralCurrency).save(cc);
        }

        for (const dc of this.debtCurrencies) {
            await this.dataSource.getRepository(DebtCurrency).save(dc);
        }

        for (const ep of this.economicalParameters) {
            await this.dataSource.getRepository(EconomicalParameters).save(ep);
        }

        for (const bpr of this.businessPaymentRequisites) {
            await this.dataSource.getRepository(BusinessPaymentRequisite).save(bpr);
        }

        for (const pp of this.paymentProcessing) {
            await this.dataSource.getRepository(PaymentProcessing).save(pp);
        }

        for (const op of this.operators) {
            await this.dataSource.getRepository(Operator).save(op);
        }
        console.log("Database seeding finished");
    }

    private getCurrencyId<T extends BaseCurrency>(symbol: string, currencies: Partial<T>[]): number {
        const currencyId = currencies.findIndex(cc => cc.symbol === symbol);
        if (currencyId === -1) {
            throw new Error(`Currency ${symbol} not found. Did you forget to add it first?`);
        }
        return currencyId + 1;
    }
}
