import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1683554126057 implements MigrationInterface {
    name = "Init1683554126057";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."operator_role_enum" AS ENUM('ADMIN', 'OPERATOR')`
        );
        await queryRunner.query(
            `CREATE TABLE "operator" ("id" SERIAL NOT NULL, "username" character varying(40) NOT NULL, "password" character varying(80) NOT NULL, "role" "public"."operator_role_enum" NOT NULL DEFAULT 'ADMIN', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_62277fe2d2a98818e7c47cc9071" UNIQUE ("username"), CONSTRAINT "PK_8b950e1572745d9f69be7748ae8" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."borrow_request_borrow_request_status_enum" AS ENUM('VERIFICATION_PENDING', 'MONEY_SENT', 'FINISHED', 'REJECTED')`
        );
        await queryRunner.query(
            `CREATE TABLE "borrow_request" ("id" SERIAL NOT NULL, "borrow_request_status" "public"."borrow_request_borrow_request_status_enum" NOT NULL DEFAULT 'VERIFICATION_PENDING', "borrow_fiat_amount" numeric(78) NOT NULL, "initial_risk_strategy" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "credit_line_id" integer, CONSTRAINT "PK_ead119ab91cdfd75fbde173c701" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."fiat_transaction_status_enum" AS ENUM('PENDING', 'COMPLETED', 'REJECTED')`
        );
        await queryRunner.query(
            `CREATE TABLE "fiat_transaction" ("id" SERIAL NOT NULL, "iban_from" character varying NOT NULL, "iban_to" character varying NOT NULL, "name_from" character varying NOT NULL, "name_to" character varying NOT NULL, "raw_transfer_amount" numeric(78) NOT NULL, "status" "public"."fiat_transaction_status_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "borrow_request_id" integer, "repay_request_id" integer, CONSTRAINT "PK_1a9da62b254ccdd8681a9ab4bc0" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."repay_request_repay_request_status_enum" AS ENUM('VERIFICATION_PENDING', 'FINISHED', 'REJECTED')`
        );
        await queryRunner.query(
            `CREATE TABLE "repay_request" ("id" SERIAL NOT NULL, "repay_request_status" "public"."repay_request_repay_request_status_enum" NOT NULL DEFAULT 'VERIFICATION_PENDING', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "credit_line_id" integer, "business_payment_requisite_id" integer, CONSTRAINT "PK_9d2f9f273ce084d1577149c5306" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "business_payment_requisite" ("id" SERIAL NOT NULL, "bank_name" character varying NOT NULL, "iban" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "debt_currency_id" integer, CONSTRAINT "PK_bc2d7821476409a0e1b4b5aff94" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "economical_parameters" ("id" SERIAL NOT NULL, "apr" numeric(78) NOT NULL, "liquidation_fee" numeric(78) NOT NULL, "collateral_factor" numeric(78) NOT NULL, "liquidation_factor" numeric(78) NOT NULL, "fiat_processing_fee" numeric(78) NOT NULL, "crypto_processing_fee" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "collateral_currency_id" integer, "debt_currency_id" integer, CONSTRAINT "PK_bdc29d32c7917a436a1becf275e" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "debt_currency" ("id" SERIAL NOT NULL, "symbol" character varying NOT NULL, "decimals" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8860676b38b769d61ecbe796aa0" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "collateral_currency" ("id" SERIAL NOT NULL, "symbol" character varying NOT NULL, "decimals" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2b8b2813e4473dad6090c333b73" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "user_payment_requisite" ("id" SERIAL NOT NULL, "iban" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, "debt_currency_id" integer, CONSTRAINT "PK_6b8457544d481e8189a01c220ba" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."deposit_request_deposit_request_status_enum" AS ENUM('PENDING', 'FINISHED', 'REJECTED')`
        );
        await queryRunner.query(
            `CREATE TABLE "deposit_request" ("id" SERIAL NOT NULL, "deposit_request_status" "public"."deposit_request_deposit_request_status_enum" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "credit_line_id" integer, CONSTRAINT "PK_0a98eb3dce48bdbd881be8e0dfe" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "crypto_transaction" ("id" SERIAL NOT NULL, "from" character varying NOT NULL, "to" character varying NOT NULL, "raw_transfer_amount" numeric(78) NOT NULL, "usd_transfer_amount" numeric(78) NOT NULL, "tx_hash" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "withdraw_request_id" integer, "deposit_request_id" integer, CONSTRAINT "PK_7107601dbf52f2f9d52d8890467" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."withdraw_request_withdraw_request_status_enum" AS ENUM('PENDING', 'FINISHED', 'REJECTED')`
        );
        await queryRunner.query(
            `CREATE TABLE "withdraw_request" ("id" SERIAL NOT NULL, "withdraw_request_status" "public"."withdraw_request_withdraw_request_status_enum" NOT NULL DEFAULT 'PENDING', "wallet_to_withdraw" character varying NOT NULL, "withdraw_amount" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "credit_line_id" integer, CONSTRAINT "PK_02e70a169eff16575401fe2239a" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."credit_line_credit_line_status_enum" AS ENUM('INITIALIZED', 'ACTIVE', 'CLOSED')`
        );
        await queryRunner.query(
            `CREATE TABLE "credit_line" ("id" SERIAL NOT NULL, "gateway_user_id" character varying NOT NULL, "credit_line_status" "public"."credit_line_credit_line_status_enum" NOT NULL DEFAULT 'INITIALIZED', "raw_collateral_amount" numeric(78) NOT NULL, "debt_amount" numeric(78) NOT NULL, "fee_accumulated_fiat_amount" numeric(78) NOT NULL, "healthy_factor" numeric(78) NOT NULL, "is_liquidated" boolean NOT NULL, "ref_number" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_payment_requisite_id" integer, "user_id" integer, "economical_parameters_id" integer, "debt_currency_id" integer, "collateral_currency_id" integer, CONSTRAINT "PK_18a28cc8a224fc38c84c53e95bd" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "user" ("id" SERIAL NOT NULL, "chat_id" integer NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_c43d9c7669f5c12f23686e1b891" UNIQUE ("chat_id"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "session" ("id" integer NOT NULL, "data" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" integer, CONSTRAINT "REL_30e98e8746699fb9af235410af" UNIQUE ("user_id"), CONSTRAINT "PK_f55da76ac1c3ac420f444d2ff11" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE TABLE "payment_processing" ("id" SERIAL NOT NULL, "url" character varying NOT NULL, "origin_name" character varying NOT NULL, "callback_auth" character varying NOT NULL, "gateway_auth" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f92510a73cf6240c1c5df6e1d27" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ADD CONSTRAINT "FK_1ab6832b92a92477ca30192a480" FOREIGN KEY ("credit_line_id") REFERENCES "credit_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" ADD CONSTRAINT "FK_78d7755df72421e978127e6b572" FOREIGN KEY ("borrow_request_id") REFERENCES "borrow_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" ADD CONSTRAINT "FK_d3113030d6a527cabbf14dbbaf5" FOREIGN KEY ("repay_request_id") REFERENCES "repay_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_bb1e26681a7e84f03ba7b692590" FOREIGN KEY ("credit_line_id") REFERENCES "credit_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_039974bd21cd9d7c699aac1fca5" FOREIGN KEY ("business_payment_requisite_id") REFERENCES "business_payment_requisite"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "business_payment_requisite" ADD CONSTRAINT "FK_dfa789b8b8f5d1a8563cb4a98df" FOREIGN KEY ("debt_currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD CONSTRAINT "FK_a029c8380f21741b3876591ce4f" FOREIGN KEY ("collateral_currency_id") REFERENCES "collateral_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD CONSTRAINT "FK_2052e37eb91c402f70df04755c2" FOREIGN KEY ("debt_currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ADD CONSTRAINT "FK_c521a1086c3777b1ad9fe7fadab" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ADD CONSTRAINT "FK_b8bf3843ac39f71396464d14768" FOREIGN KEY ("debt_currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" ADD CONSTRAINT "FK_637a8dce31f57b1f78ca514519f" FOREIGN KEY ("credit_line_id") REFERENCES "credit_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" ADD CONSTRAINT "FK_ed0dcaec737e44e25a8dd12fcb8" FOREIGN KEY ("withdraw_request_id") REFERENCES "withdraw_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" ADD CONSTRAINT "FK_72d6de5d987cba8240db32021fd" FOREIGN KEY ("deposit_request_id") REFERENCES "deposit_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ADD CONSTRAINT "FK_60a1dfcf5d844760d58797b65bf" FOREIGN KEY ("credit_line_id") REFERENCES "credit_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_286dcb0f5af72994bf411bb71a6" FOREIGN KEY ("user_payment_requisite_id") REFERENCES "user_payment_requisite"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_64539eea5c63d00bfa3c34ecf74" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_cc806b89dec6e8f11f1c04dd871" FOREIGN KEY ("economical_parameters_id") REFERENCES "economical_parameters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_2bc37ae5367ca1037d81361b265" FOREIGN KEY ("debt_currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_826ba1567248dea33d23686d17c" FOREIGN KEY ("collateral_currency_id") REFERENCES "collateral_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "session" ADD CONSTRAINT "FK_30e98e8746699fb9af235410aff" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "session" DROP CONSTRAINT "FK_30e98e8746699fb9af235410aff"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_826ba1567248dea33d23686d17c"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_2bc37ae5367ca1037d81361b265"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_cc806b89dec6e8f11f1c04dd871"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_64539eea5c63d00bfa3c34ecf74"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_286dcb0f5af72994bf411bb71a6"`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" DROP CONSTRAINT "FK_60a1dfcf5d844760d58797b65bf"`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" DROP CONSTRAINT "FK_72d6de5d987cba8240db32021fd"`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" DROP CONSTRAINT "FK_ed0dcaec737e44e25a8dd12fcb8"`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" DROP CONSTRAINT "FK_637a8dce31f57b1f78ca514519f"`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" DROP CONSTRAINT "FK_b8bf3843ac39f71396464d14768"`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" DROP CONSTRAINT "FK_c521a1086c3777b1ad9fe7fadab"`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP CONSTRAINT "FK_2052e37eb91c402f70df04755c2"`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP CONSTRAINT "FK_a029c8380f21741b3876591ce4f"`
        );
        await queryRunner.query(
            `ALTER TABLE "business_payment_requisite" DROP CONSTRAINT "FK_dfa789b8b8f5d1a8563cb4a98df"`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP CONSTRAINT "FK_039974bd21cd9d7c699aac1fca5"`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP CONSTRAINT "FK_bb1e26681a7e84f03ba7b692590"`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" DROP CONSTRAINT "FK_d3113030d6a527cabbf14dbbaf5"`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" DROP CONSTRAINT "FK_78d7755df72421e978127e6b572"`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" DROP CONSTRAINT "FK_1ab6832b92a92477ca30192a480"`
        );
        await queryRunner.query(`DROP TABLE "payment_processing"`);
        await queryRunner.query(`DROP TABLE "session"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "credit_line"`);
        await queryRunner.query(`DROP TYPE "public"."credit_line_credit_line_status_enum"`);
        await queryRunner.query(`DROP TABLE "withdraw_request"`);
        await queryRunner.query(`DROP TYPE "public"."withdraw_request_withdraw_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "crypto_transaction"`);
        await queryRunner.query(`DROP TABLE "deposit_request"`);
        await queryRunner.query(`DROP TYPE "public"."deposit_request_deposit_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "user_payment_requisite"`);
        await queryRunner.query(`DROP TABLE "collateral_currency"`);
        await queryRunner.query(`DROP TABLE "debt_currency"`);
        await queryRunner.query(`DROP TABLE "economical_parameters"`);
        await queryRunner.query(`DROP TABLE "business_payment_requisite"`);
        await queryRunner.query(`DROP TABLE "repay_request"`);
        await queryRunner.query(`DROP TYPE "public"."repay_request_repay_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "fiat_transaction"`);
        await queryRunner.query(`DROP TYPE "public"."fiat_transaction_status_enum"`);
        await queryRunner.query(`DROP TABLE "borrow_request"`);
        await queryRunner.query(`DROP TYPE "public"."borrow_request_borrow_request_status_enum"`);
        await queryRunner.query(`DROP TABLE "operator"`);
        await queryRunner.query(`DROP TYPE "public"."operator_role_enum"`);
    }
}
