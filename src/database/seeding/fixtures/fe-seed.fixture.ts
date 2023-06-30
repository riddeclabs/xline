import { DataSource } from "typeorm";
import entities from "../../entities";
import migrations from "../../migrations";
import { SUPPORTED_TOKENS } from "../../../modules/bot/constants";
import { EntityBatchGenerator } from "../../../test/utils/entity-batch-generator";

// Allows you to generate fully customized credit lines (with users, details, requests, transactions, etc.)
// based on a pair of tokens (collateral and debt).
// Combines with an initial seeder script, does not drop the database schema or modify existing records.
(async () => {
    const dataSource = new DataSource({
        type: "postgres",
        host: process.env.DB_HOST || "0.0.0.0",
        port: Number(process.env.DB_PORT) || 5432,
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "xline",
        dropSchema: false,
        logging: false,
        logger: "advanced-console",
        entities: entities,
        migrations: migrations,
    });
    await dataSource.initialize();
    await dataSource.runMigrations();

    const seeder = new EntityBatchGenerator(dataSource);

    // Specify how much credit lines you want to create for each uniq currency pair
    const creditLinesAmount = 20;

    await seeder.createBatchOfCreditLines(creditLinesAmount, {
        currencyPair: {
            collateralCurrency: { symbol: SUPPORTED_TOKENS.ETH, decimals: 18 },
            debtCurrency: { symbol: "USD", decimals: 18 },
        },
    });

    await seeder.createBatchOfCreditLines(creditLinesAmount, {
        currencyPair: {
            collateralCurrency: { symbol: SUPPORTED_TOKENS.BTC, decimals: 8 },
            debtCurrency: { symbol: "USD", decimals: 18 },
        },
    });

    console.log(
        `📂 Applying FE fixture successfully finished!\n ${
            creditLinesAmount * 2
        } credit lines was added.`
    );

    await dataSource.destroy();
})();
