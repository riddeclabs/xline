import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentProcessing1683535222004 implements MigrationInterface {
    name = "PaymentProcessing1683535222004";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "payment_processing" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "origin_name" character varying NOT NULL, "callback_auth" character varying NOT NULL, "gateway_auth" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f92510a73cf6240c1c5df6e1d27" PRIMARY KEY ("id"))`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "payment_processing"`);
    }
}
