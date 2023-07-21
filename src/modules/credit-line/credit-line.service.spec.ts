import { Test, TestingModule } from "@nestjs/testing";

import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditLineService } from "./credit-line.service";
import { CreditLineModule } from "./credit-line.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { entities, migrations } from "../../database";
import { TypeOrmModuleOptions } from "@nestjs/typeorm/dist/interfaces/typeorm-options.interface";
import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import { CreditLine } from "../../database/entities";
import { CreateCreditLineDto } from "./dto/create-credit-line.dto";
import { TestDatabaseSeeder } from "../../test/utils/database-seeder";

describe("ReviewService", () => {
    let dataSource: DataSource;

    let seeder: TestDatabaseSeeder;
    let creditLine_ETH_USD: CreditLine;
    let creditLine_BTC_USD: CreditLine;

    let creditLineService: CreditLineService;
    let app: INestApplication;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                CreditLineModule,
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (configService: ConfigService) =>
                        ({
                            type: "postgres",
                            migrationsRun: true,
                            dropSchema: false,
                            host: configService.get("DB_HOST"),
                            port: configService.get("DB_PORT"),
                            username: configService.get("DB_USERNAME"),
                            password: configService.get("DB_PASSWORD"),
                            database: configService.get("DB_NAME"),
                            entities,
                            migrations,
                        } as TypeOrmModuleOptions),
                }),
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();

        creditLineService = module.get<CreditLineService>(CreditLineService);

        // TODO: Find a more proper way to setup a connection to database ( remove double connection )
        dataSource = new DataSource({
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
    });

    beforeEach(async () => {
        await dataSource.initialize();
        await dataSource.dropDatabase();
        await dataSource.runMigrations();

        seeder = new TestDatabaseSeeder(dataSource);
        creditLine_ETH_USD = await seeder.makeCreditLine();
        creditLine_BTC_USD = await seeder.makeCreditLine();
    });

    afterEach(async () => {
        await dataSource.destroy();
    });

    afterAll(async () => {
        await app.close();
    });

    describe("getCreditLineById", () => {
        it("should return correct value", async () => {
            const result = await creditLineService.getCreditLineById(creditLine_BTC_USD.id);

            expect(result).toBeDefined();
            expect(result.id).toEqual(creditLine_BTC_USD.id);

            // Check that we don't have joined relations
            expect(result.collateralCurrency).toBeUndefined();
            expect(result.debtCurrency).toBeUndefined();
            expect(result.economicalParameters).toBeUndefined();
            expect(result.userPaymentRequisite).toBeUndefined();
            expect(result.user).toBeUndefined();
        });

        it("should fail if creditLine not found", async () => {
            // Use ID = 0 due to such id will never be reached
            await expect(creditLineService.getCreditLineById(0)).rejects.toThrow();
        });
    });

    describe("saveNewCreditLine", () => {
        it("should save correct entity", async () => {
            const clDto: CreateCreditLineDto = {
                userPaymentRequisiteId: creditLine_BTC_USD.userPaymentRequisiteId,
                userId: creditLine_BTC_USD.userId,
                gatewayUserId: "97647835",
                economicalParametersId: creditLine_BTC_USD.economicalParametersId,
                debtCurrencyId: creditLine_BTC_USD.debtCurrencyId,
                collateralCurrencyId: creditLine_BTC_USD.collateralCurrencyId,
                refNumber: "SOME_REF_NUMBER",
                isLiquidated: true,
            };

            const newCl = await creditLineService.saveNewCreditLine(clDto);

            expect(newCl).toHaveProperty("id");
            expect(newCl.rawDepositAmount).toEqual(0n);
            expect(newCl.debtAmount).toEqual(0n);
            expect(newCl.feeAccumulatedFiatAmount).toEqual(0n);
            expect(newCl.healthyFactor).toEqual(0n);

            expect(newCl.refNumber).toEqual(clDto.refNumber);
            expect(newCl.isLiquidated).toEqual(clDto.isLiquidated);

            expect(newCl.userPaymentRequisiteId).toEqual(clDto.userPaymentRequisiteId);
            expect(newCl.userId).toEqual(clDto.userId);
            expect(newCl.gatewayUserId).toEqual(clDto.gatewayUserId);
            expect(newCl.economicalParametersId).toEqual(clDto.economicalParametersId);
            expect(newCl.debtCurrencyId).toEqual(clDto.debtCurrencyId);
            expect(newCl.collateralCurrencyId).toEqual(clDto.collateralCurrencyId);
        });

        it("should fail if some field is missed", async () => {
            // refNumber is missed
            await expect(
                creditLineService.saveNewCreditLine({
                    userPaymentRequisiteId: creditLine_BTC_USD.userPaymentRequisiteId,
                    userId: creditLine_BTC_USD.userId,
                    gatewayUserId: "97647835",
                    economicalParametersId: creditLine_BTC_USD.economicalParametersId,
                    debtCurrencyId: creditLine_BTC_USD.debtCurrencyId,
                    collateralCurrencyId: creditLine_BTC_USD.collateralCurrencyId,
                    isLiquidated: true,
                } as CreateCreditLineDto)
            ).rejects.toThrow();
        });
    });

    describe("increaseDebtAmountById", () => {
        it("should increase the `debtAmount` of a credit line", async () => {
            const addAmount = 100501n;
            const debtAmountBefore = 777n;

            const creditLine = await seeder.makeCreditLine({
                debtAmount: debtAmountBefore,
            });

            const updatedCl = await creditLineService.increaseDebtAmountById(creditLine.id, addAmount);

            expect(updatedCl.id).toEqual(creditLine.id);
            expect(updatedCl.debtAmount).toEqual(debtAmountBefore + addAmount);
        });
    });

    describe("decreaseDebtAmountById", () => {
        it("should decrease the `debtAmount` of a credit line", async () => {
            const subtractAmount = 51n;
            const initialAmount = 100n;

            const creditLine = await seeder.makeCreditLine({
                debtAmount: initialAmount,
            });
            const updatedCl = await creditLineService.decreaseDebtAmountById(
                creditLine.id,
                subtractAmount
            );

            expect(updatedCl.id).toEqual(creditLine.id);
            expect(updatedCl.debtAmount).toEqual(initialAmount - subtractAmount);
        });
    });

    describe("increaseAccumulatedFeeAmountById", () => {
        it("should increase the `feeAccumulatedFiatAmount` of a credit line", async () => {
            const addAmount = 201n;
            const initialFeeAmount = 122n;

            const creditLine = await seeder.makeCreditLine({
                feeAccumulatedFiatAmount: initialFeeAmount,
            });

            const updatedCl = await creditLineService.increaseAccumulatedFeeAmountById(
                creditLine.id,
                addAmount
            );

            expect(updatedCl.id).toEqual(creditLine.id);
            expect(updatedCl.feeAccumulatedFiatAmount).toEqual(initialFeeAmount + addAmount);
        });
    });

    describe("updateDebtAmountAndFeeAccumulatedById", () => {
        it("should update the `feeAccumulatedFiatAmount` and `debtAmount` of a credit line", async () => {
            const newDebtAmount = 1775n;
            const newFeeAmount = 142n;

            await creditLineService.increaseDebtAmountAndFeeAccumulatedById(
                creditLine_BTC_USD.id,
                newDebtAmount,
                newFeeAmount
            );
            const updatedCl = await creditLineService.getCreditLineById(creditLine_BTC_USD.id);

            expect(updatedCl.id).toEqual(creditLine_BTC_USD.id);
            expect(updatedCl.debtAmount).toEqual(newDebtAmount);
            expect(updatedCl.feeAccumulatedFiatAmount).toEqual(newFeeAmount);
        });
    });

    describe("updateDepositAmountById", () => {
        it("should update the `rawCollateralAmount` of a credit line", async () => {
            const newRawCollateralAmount = 1775n;

            await creditLineService.updateDepositAmountById(
                creditLine_BTC_USD.id,
                newRawCollateralAmount
            );
            const updatedCl = await creditLineService.getCreditLineById(creditLine_BTC_USD.id);

            expect(updatedCl.id).toEqual(creditLine_BTC_USD.id);
            expect(updatedCl.rawDepositAmount).toEqual(newRawCollateralAmount);
        });
    });

    describe("getCreditLineByChatIdAndColSymbol", () => {
        it("should return a credit line by chat ID and collateral symbol", async () => {
            const antonio = await seeder.makeUser({ chatId: 228777 });
            const ETH = await seeder.makeCollateralCurrency({
                symbol: "ETH",
            });
            const BTC = await seeder.makeCollateralCurrency({
                symbol: "BTC",
            });

            // Currently we don't have a credit line with following parameters
            // Should return `NULL`
            let result = await creditLineService.getCreditLineByChatIdAndColSymbol(
                antonio.chatId,
                ETH.symbol
            );

            expect(result).toBeNull();

            const ETH_creditLine = await seeder.makeCreditLine({
                collateralCurrencyId: ETH.id,
                userId: antonio.id,
            });
            // Create a second credit line for the same user with uniq chatId
            await seeder.makeCreditLine({
                collateralCurrencyId: BTC.id,
                userId: antonio.id,
            });

            result = await creditLineService.getCreditLineByChatIdAndColSymbol(
                antonio.chatId,
                ETH.symbol
            );

            expect(result).toBeDefined();
            expect(result?.id).toEqual(ETH_creditLine.id);
            expect(result?.collateralCurrencyId).toEqual(ETH.id);
            expect(result?.userId).toEqual(antonio.id);

            // Check joined relations
            expect(result?.collateralCurrency.id).toEqual(ETH.id);
            expect(result?.economicalParameters.id).toEqual(ETH_creditLine.economicalParameters.id);
        });
    });

    describe("getCreditLinesByChatIdCurrencyExtended", () => {
        it("should return credit lines by chat ID with extended currency information", async () => {
            const antonio = await seeder.makeUser({ chatId: 228777 });
            const ETH = await seeder.makeCollateralCurrency({
                symbol: "ETH",
            });
            const BTC = await seeder.makeCollateralCurrency({
                symbol: "BTC",
            });
            const USD = await seeder.makeDebtCurrency({
                symbol: "USD",
            });
            const ETH_USD_creditLine = await seeder.makeCreditLine({
                collateralCurrencyId: ETH.id,
                debtCurrencyId: USD.id,
                userId: antonio.id,
            });

            const BTC_USD_creditLine = await seeder.makeCreditLine({
                collateralCurrencyId: BTC.id,
                debtCurrencyId: USD.id,
                userId: antonio.id,
            });

            const result = await creditLineService.getCreditLinesByChatIdCurrencyExtended(
                antonio.chatId
            );
            const [cl1, cl2] = result;

            expect(cl1).toBeDefined();
            expect(cl2).toBeDefined();
            expect(result.length).toEqual(2);

            expect(cl1?.id).toEqual(ETH_USD_creditLine.id);
            expect(cl1?.collateralCurrencyId).toEqual(ETH.id);
            expect(cl1?.debtCurrencyId).toEqual(USD.id);
            expect(cl1?.userId).toEqual(antonio.id);
            // Check joined relations
            expect(cl1?.collateralCurrency.id).toEqual(ETH.id);
            expect(cl1?.debtCurrency.id).toEqual(USD.id);

            expect(cl2?.id).toEqual(BTC_USD_creditLine.id);
            expect(cl2?.collateralCurrencyId).toEqual(BTC.id);
            expect(cl2?.debtCurrencyId).toEqual(USD.id);
            expect(cl2?.userId).toEqual(antonio.id);
            // Check joined relations
            expect(cl2?.collateralCurrency.id).toEqual(BTC.id);
            expect(cl2?.debtCurrency.id).toEqual(USD.id);
        });
    });

    describe("getCreditLinesByIdAllSettingsExtended", () => {
        it("should return credit line by `creditLineId` with all settings extended", async () => {
            const result = await creditLineService.getCreditLinesByIdAllSettingsExtended(
                creditLine_ETH_USD.id
            );

            expect(result).toBeDefined();
            expect(result.id).toEqual(creditLine_ETH_USD.id);
            // Check joined relations
            expect(result.collateralCurrency.id).toEqual(creditLine_ETH_USD.collateralCurrency.id);
            expect(result.debtCurrency.id).toEqual(creditLine_ETH_USD.debtCurrency.id);
            expect(result.user.id).toEqual(creditLine_ETH_USD.user.id);
            expect(result.economicalParameters.id).toEqual(creditLine_ETH_USD.economicalParameters.id);
            expect(result.userPaymentRequisite.id).toEqual(creditLine_ETH_USD.userPaymentRequisite.id);
        });

        it("should fail if creditLine not found", async () => {
            await expect(
                creditLineService.getCreditLinesByIdAllSettingsExtended(100500)
            ).rejects.toThrow();
        });
    });
});
