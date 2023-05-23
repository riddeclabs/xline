import { MigrationInterface, QueryRunner } from "typeorm";

export class CurrenciesUnique1684830957456 implements MigrationInterface {
    name = 'CurrenciesUnique1684830957456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "debt_currency" ADD CONSTRAINT "UQ_2b93187fc0f31385caf1df6b04e" UNIQUE ("symbol")`);
        await queryRunner.query(`ALTER TABLE "collateral_currency" ADD CONSTRAINT "UQ_1244cd616978f6c56014760c704" UNIQUE ("symbol")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collateral_currency" DROP CONSTRAINT "UQ_1244cd616978f6c56014760c704"`);
        await queryRunner.query(`ALTER TABLE "debt_currency" DROP CONSTRAINT "UQ_2b93187fc0f31385caf1df6b04e"`);
    }

}
