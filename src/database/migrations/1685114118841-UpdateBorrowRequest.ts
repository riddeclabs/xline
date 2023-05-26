import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBorrowRequest1685114118841 implements MigrationInterface {
    name = 'UpdateBorrowRequest1685114118841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "borrow_request" ALTER COLUMN "borrow_fiat_amount" TYPE numeric(78)`);
        await queryRunner.query(`ALTER TABLE "borrow_request" ALTER COLUMN "borrow_fiat_amount" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "borrow_request" ALTER COLUMN "initial_risk_strategy" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "borrow_request" ALTER COLUMN "initial_risk_strategy" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "debt_currency" DROP CONSTRAINT "UQ_2b93187fc0f31385caf1df6b04e"`);
        await queryRunner.query(`ALTER TABLE "collateral_currency" DROP CONSTRAINT "UQ_1244cd616978f6c56014760c704"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collateral_currency" ADD CONSTRAINT "UQ_1244cd616978f6c56014760c704" UNIQUE ("symbol")`);
        await queryRunner.query(`ALTER TABLE "debt_currency" ADD CONSTRAINT "UQ_2b93187fc0f31385caf1df6b04e" UNIQUE ("symbol")`);
        await queryRunner.query(`ALTER TABLE "borrow_request" ALTER COLUMN "initial_risk_strategy" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "borrow_request" ALTER COLUMN "initial_risk_strategy" TYPE numeric(78,0)`);
        await queryRunner.query(`ALTER TABLE "borrow_request" ALTER COLUMN "borrow_fiat_amount" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "borrow_request" ALTER COLUMN "borrow_fiat_amount" TYPE numeric(78,0)`);
    }

}
