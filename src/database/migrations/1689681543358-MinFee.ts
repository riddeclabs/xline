import { MigrationInterface, QueryRunner } from "typeorm";

export class MinFee1689681543358 implements MigrationInterface {
    name = "MinFee1689681543358";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD "min_fiat_processing_fee" numeric(78) NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD "min_crypto_processing_fee" numeric(78) NOT NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP COLUMN "min_crypto_processing_fee"`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP COLUMN "min_fiat_processing_fee"`
        );
    }
}
