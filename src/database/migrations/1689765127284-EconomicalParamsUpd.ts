import { MigrationInterface, QueryRunner } from "typeorm";

export class EconomicalParamsUpd1689765127284 implements MigrationInterface {
    name = "EconomicalParamsUpd1689765127284";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" RENAME COLUMN "min_crypto_processing_fee" TO "min_crypto_processing_fee_fiat"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" RENAME COLUMN "raw_collateral_amount" TO "raw_deposit_amount"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "credit_line" RENAME COLUMN "raw_deposit_amount" TO "raw_collateral_amount"`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" RENAME COLUMN "min_crypto_processing_fee_fiat" TO "min_crypto_processing_fee"`
        );
    }
}
