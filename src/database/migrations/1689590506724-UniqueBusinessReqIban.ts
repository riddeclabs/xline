import { MigrationInterface, QueryRunner } from "typeorm";

export class UniqueBusinessReqIban1689590506724 implements MigrationInterface {
    name = "UniqueBusinessReqIban1689590506724";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "business_payment_requisite" ADD CONSTRAINT "UQ_a2e0fefbf7978737eeaa9c7d969" UNIQUE ("iban")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "business_payment_requisite" DROP CONSTRAINT "UQ_a2e0fefbf7978737eeaa9c7d969"`
        );
    }
}
