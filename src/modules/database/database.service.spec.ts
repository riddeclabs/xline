import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseService } from "./database.service";
import { Currency, ExtendedCreditLineState } from "../../common/database.type";
import { DataSource } from "typeorm";
import { entities, migrations } from "../../database";
import {
    CreditLineState,
    CreditRequest,
    EconomicModel,
    ProcessingSettings,
    RepayRequest,
    WithdrawRequest,
} from "../../database/entities";
import { ApproveStatus, CreditLineStateStatus, CreditRequestStatus } from "../../common";
import { DatabaseModule } from "./database.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

describe("DatabaseService", () => {
    let service: DatabaseService;
    const DB_URL = "postgresql://postgres:postgres@localhost/xline";

    const dataSource = new DataSource({
        type: "postgres",
        url: DB_URL,
        entities: entities,
        migrations: migrations,
    });

    beforeAll(async function () {
        await dataSource.initialize();
        await dataSource.runMigrations();
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRootAsync({
                    imports: [ConfigModule],
                    useFactory: (configService: ConfigService) => ({
                        type: "postgres",
                        migrationsRun: true, //process.env.NODE_ENV === 'production',
                        host: configService.get("DB_HOST")!,
                        port: configService.get("DB_PORT")!,
                        username: configService.get("DB_USERNAME")!,
                        password: configService.get("DB_PASSWORD")!,
                        database: configService.get("DB_NAME")!,
                        entities,
                        migrations,
                        synchronize: true, //process.env.NODE_ENV === 'development',
                        dropSchema: true,
                    }),
                    inject: [ConfigService],
                }),
                DatabaseModule,
            ],
        }).compile();

        service = module.get<DatabaseService>(DatabaseService);

        const creditRequest: Partial<CreditRequest> = {
            creditRequestStatus: CreditRequestStatus.FINISHED,
            collateralCurrency: Currency.ETH,
            userId: "Alice16",
            walletAddress: "0x1234567890123456789012345678901234567890",
            requestedCollAmount: 1000000000000000n,
            actualCollAmount: 1000000000000000n,
            requestedCreditAmount: 1000000000000000n,
            iban: "DE12345678901234567890",
            apr: 1000000000000000n,
            collateralFactor: 1000000000000000n,
            liquidationFactor: 1000000000000000n,
            liquidationFee: 1000000000000000n,
            approveStatus: ApproveStatus.APPROVED,
            rejectedReason: "",
            isFiatSent: true,
        };

        const creditLineState: Partial<CreditLineState> = {
            creditRequestPk: 1,
            creditLineStateStatus: CreditLineStateStatus.ACTIVE,
            rawCollateralAmount: 1000000000000000n,
            feeAccumulatedFiat: 1000000000000000n,
            healthFactor: 1000000000000000n,
            debtAmountFiat: 1000000000000000n,
            isLiquidated: false,
        };

        await dataSource.getRepository(CreditRequest).save(creditRequest);
        await dataSource.getRepository(CreditLineState).save(creditLineState);
    });

    afterAll(async function () {
        await dataSource.destroy();
    });

    it("getActiveCreditLines should return empty array", async () => {
        expect(await service.getActiveCreditLines("Bob404")).toEqual([]);
        expect(await service.getActiveCreditLines("Bob404", Currency.BTC)).toEqual([]);
    });

    it("getCreditLineState should return correct state", async () => {
        const creditLineState: ExtendedCreditLineState[] = await service.getActiveCreditLines("Alice16");
        expect(creditLineState.length).toEqual(1);
        console.log(creditLineState[0]?.id);
    });

    it("getCreditLineState should return null", async () => {
        expect(await service.getCreditLineStateById(1000)).toEqual(null);
    });

    it("getCreditRequest should return null", async () => {
        expect(await service.getCreditRequestById(1000)).toEqual(null);
    });

    /*
    it("getEconomicModel should return null", async () => {
        expect(await service.getEconomicModel()).toEqual(null);
    });*/

    /*
    it("getProcessingSettings should return null", async () => {
        expect(await service.getProcessingSettings()).toEqual(null);
    });*/

    it("getRepayRequest should return null", async () => {
        expect(await service.getRepayRequestById(1000)).toEqual(null);
    });

    it("getUsersRepayRequests should return empty array", async () => {
        expect(await service.getUsersRepayRequests("Bob404", Currency.BTC)).toEqual([]);
    });

    it("getWithdrawRequest should return null", async () => {
        expect(await service.getWithdrawRequestById(1000)).toEqual(null);
    });

    it("getUsersWithdrawRequests should return empty array", async () => {
        expect(await service.getUsersWithdrawRequests("Bob404", Currency.BTC)).toEqual([]);
    });
});
