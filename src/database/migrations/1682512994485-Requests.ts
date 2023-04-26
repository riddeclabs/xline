import { MigrationInterface, QueryRunner } from "typeorm";

export class Requests1682512994485 implements MigrationInterface {
    name = "Requests1682512994485";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."repay_request_repay_request_status_enum" AS ENUM('FIAT_REPAY_WAITING', 'COLLATERAL_WITHDRAW_WAITING', 'FINISHED', 'ERROR')`
        );
        await queryRunner.query(
            `CREATE TABLE "repay_request" ("id" SERIAL NOT NULL, "repay_request_status" "public"."repay_request_repay_request_status_enum" NOT NULL DEFAULT 'FIAT_REPAY_WAITING', "actual_repay_request_amount" numeric(78) NOT NULL, "tx_hash" character varying NOT NULL, "actual_wallet_address" character varying NOT NULL, "requested_wallet_address" character varying NOT NULL, "requested_repay_amount" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "credit_line_state_pk" integer, CONSTRAINT "REL_041c149f0e16b112ee8f9f0b81" UNIQUE ("credit_line_state_pk"), CONSTRAINT "PK_9d2f9f273ce084d1577149c5306" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."credit_line_state_credit_line_status_enum" AS ENUM('ACTIVE', 'CLOSED')`
        );
        await queryRunner.query(
            `CREATE TABLE "credit_line_state" ("id" SERIAL NOT NULL, "credit_line_status" "public"."credit_line_state_credit_line_status_enum" NOT NULL DEFAULT 'ACTIVE', "raw_collateral_amount" numeric(78) NOT NULL, "fee_accumulated_fiat" numeric(78) NOT NULL, "health_factor" numeric(78) NOT NULL, "debt_amount_fiat" numeric(78) NOT NULL, "is_liquidated" boolean NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "credit_request_pk" integer, CONSTRAINT "REL_cd52b806baf3a62697b3c9380e" UNIQUE ("credit_request_pk"), CONSTRAINT "PK_4ef9bfacc66f0b831191d09cb79" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."withdraw_request_withdraw_request_status_enum" AS ENUM('WITHDRAW_WAITING', 'WITHDRAW_SUCCESS', 'WITHDRAW_ERROR')`
        );
        await queryRunner.query(
            `CREATE TABLE "withdraw_request" ("id" SERIAL NOT NULL, "withdraw_request_status" "public"."withdraw_request_withdraw_request_status_enum" NOT NULL DEFAULT 'WITHDRAW_WAITING', "wallet_address_to_withdraw" character varying NOT NULL, "requested_withdraw_amount" numeric(78) NOT NULL, "actual_withdraw_amount" numeric(78) NOT NULL, "tx_hash" character varying NOT NULL, "error_message" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "credit_request_pk" integer, CONSTRAINT "REL_293f8736ac23ecc352abd0b384" UNIQUE ("credit_request_pk"), CONSTRAINT "PK_02e70a169eff16575401fe2239a" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."credit_request_credit_request_status_enum" AS ENUM('DEPOSIT_WAITING', 'APPROVE_WAITING', 'FINISHED', 'ERROR')`
        );
        await queryRunner.query(
            `CREATE TABLE "credit_request" ("id" SERIAL NOT NULL, "credit_request_status" "public"."credit_request_credit_request_status_enum" NOT NULL DEFAULT 'DEPOSIT_WAITING', "collateral_currency" character varying NOT NULL, "user_id" character varying NOT NULL, "wallet_address" character varying NOT NULL, "requested_coll_amount" numeric(78) NOT NULL, "actual_coll_amount" numeric(78) NOT NULL DEFAULT 0, "requested_credit_amount" numeric(78) NOT NULL, "iban" character varying NOT NULL, "apr" numeric(78) NOT NULL, "collateral_factor" numeric(78) NOT NULL, "liquidation_factor" numeric(78) NOT NULL, "liquidation_fee" numeric(78) NOT NULL, "approve_status" character varying NOT NULL, "rejected_reason" character varying NOT NULL, "is_fiat_sent" boolean NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a5e5e24dc34548f6a2bb8c1c27b" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "processing_settings" ("id" SERIAL NOT NULL, "payment_timeout" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_037045e1bbb226253db1efdb518" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "economic_model" ("id" SERIAL NOT NULL, "apr" numeric(78) NOT NULL, "collateral_factor" numeric(78) NOT NULL, "liquidation_factor" numeric(78) NOT NULL, "liquidation_fee" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_50f3942a4f1a2c53c980616c134" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_041c149f0e16b112ee8f9f0b81e" FOREIGN KEY ("credit_line_state_pk") REFERENCES "credit_line_state"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line_state" ADD CONSTRAINT "FK_cd52b806baf3a62697b3c9380e1" FOREIGN KEY ("credit_request_pk") REFERENCES "credit_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ADD CONSTRAINT "FK_293f8736ac23ecc352abd0b3844" FOREIGN KEY ("credit_request_pk") REFERENCES "credit_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" DROP CONSTRAINT "FK_293f8736ac23ecc352abd0b3844"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line_state" DROP CONSTRAINT "FK_cd52b806baf3a62697b3c9380e1"`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP CONSTRAINT "FK_041c149f0e16b112ee8f9f0b81e"`
        );
        await queryRunner.query(`DROP TABLE "economic_model"`);
        await queryRunner.query(`DROP TABLE "processing_settings"`);
        await queryRunner.query(`DROP TABLE "credit_request"`);
        await queryRunner.query(`DROP TYPE "public"."credit_request_credit_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "withdraw_request"`);
        await queryRunner.query(`DROP TYPE "public"."withdraw_request_withdraw_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "credit_line_state"`);
        await queryRunner.query(`DROP TYPE "public"."credit_line_state_credit_line_status_enum"`);
        await queryRunner.query(`DROP TABLE "repay_request"`);
        await queryRunner.query(`DROP TYPE "public"."repay_request_repay_request_status_enum"`);
    }
}
