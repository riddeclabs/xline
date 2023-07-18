import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAccruedAt1689165378233 implements MigrationInterface {
    name = "AddAccruedAt1689165378233";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD "accrued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "accrued_at"`);
    }
}
