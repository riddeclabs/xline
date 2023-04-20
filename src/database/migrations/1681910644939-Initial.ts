import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1681910644939 implements MigrationInterface {
    name = "Initial1681910644939";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "account" ("id" SERIAL NOT NULL, "account_id" integer NOT NULL, "username" character varying(40) NOT NULL DEFAULT '', "first_name" character varying(80) NOT NULL DEFAULT '', "last_name" character varying(80) NOT NULL DEFAULT '', "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, CONSTRAINT "UQ_ea08b54a9d7322975ffc57fc612" UNIQUE ("account_id"), CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_d2ce6f33ff075509688df11e54" ON "account" ("account_id", "username") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."operator_role_enum" AS ENUM('admin', 'operator')`
        );
        await queryRunner.query(
            `CREATE TABLE "operator" ("id" SERIAL NOT NULL, "username" character varying(40) NOT NULL, "password" character varying(80) NOT NULL, "role" "public"."operator_role_enum" NOT NULL DEFAULT 'admin', "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone, "deleted_at" TIMESTAMP, CONSTRAINT "UQ_62277fe2d2a98818e7c47cc9071" UNIQUE ("username"), CONSTRAINT "PK_8b950e1572745d9f69be7748ae8" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_b87fa13294d244adbfcba07c8c" ON "operator" ("id", "username") `
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b87fa13294d244adbfcba07c8c"`);
        await queryRunner.query(`DROP TABLE "operator"`);
        await queryRunner.query(`DROP TYPE "public"."operator_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2ce6f33ff075509688df11e54"`);
        await queryRunner.query(`DROP TABLE "account"`);
    }
}
