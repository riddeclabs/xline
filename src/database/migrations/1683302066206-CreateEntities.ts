import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntities1683302066206 implements MigrationInterface {
    name = "CreateEntities1683302066206";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_b87fa13294d244adbfcba07c8c"`);
        await queryRunner.query(
            `CREATE TABLE "user" ("id" SERIAL NOT NULL, "chat_id" integer NOT NULL, "name" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_cace4a159ff9f2512dd4237376" ON "user" ("id") `
        );
        await queryRunner.query(
            `CREATE TABLE "debt_currency" ("id" SERIAL NOT NULL, "symbol" character varying NOT NULL, "decimals" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8860676b38b769d61ecbe796aa0" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_8860676b38b769d61ecbe796aa" ON "debt_currency" ("id") `
        );
        await queryRunner.query(
            `CREATE TABLE "collateral_currency" ("id" SERIAL NOT NULL, "symbol" character varying NOT NULL, "decimals" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2b8b2813e4473dad6090c333b73" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_2b8b2813e4473dad6090c333b7" ON "collateral_currency" ("id") `
        );
        await queryRunner.query(
            `CREATE TABLE "user_payment_requisite" ("id" SERIAL NOT NULL, "iban" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userIdId" integer, "currencyIdId" integer, CONSTRAINT "PK_6b8457544d481e8189a01c220ba" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_6b8457544d481e8189a01c220b" ON "user_payment_requisite" ("id") `
        );
        await queryRunner.query(
            `CREATE TABLE "economical_parameters" ("id" SERIAL NOT NULL, "apr" numeric(78) NOT NULL, "liquidation_fee" numeric(78) NOT NULL, "collateral_factor" numeric(78) NOT NULL, "liquidation_Factor" numeric(78) NOT NULL, "fiat_processing_fee" numeric(78) NOT NULL, "crypto_processing_fee" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "collateralCurrencyIdId" integer, "debtCurrencyIdId" integer, CONSTRAINT "PK_bdc29d32c7917a436a1becf275e" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_bdc29d32c7917a436a1becf275" ON "economical_parameters" ("id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."credit_line_credit_line_status_enum" AS ENUM('PENDING')`
        );
        await queryRunner.query(
            `CREATE TABLE "credit_line" ("id" SERIAL NOT NULL, "credit_line_status" "public"."credit_line_credit_line_status_enum" NOT NULL, "raw_collateral_amount" numeric(78) NOT NULL, "debt_amount" numeric(78) NOT NULL, "fee_accumulated_fiat_amount" numeric(78) NOT NULL, "healthy_factor" numeric(78) NOT NULL, "is_liquidated" boolean NOT NULL, "ref_number" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userPaymentRequisiteIdId" integer, "userIdId" integer, "economicalParametersIdId" integer, "debtCurrencyIdId" integer, "collateralCurrencyIdId" integer, CONSTRAINT "PK_18a28cc8a224fc38c84c53e95bd" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_18a28cc8a224fc38c84c53e95b" ON "credit_line" ("id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."withdraw_request_withdraw_request_status_enum" AS ENUM('PENDING')`
        );
        await queryRunner.query(
            `CREATE TABLE "withdraw_request" ("id" SERIAL NOT NULL, "withdraw_request_status" "public"."withdraw_request_withdraw_request_status_enum" NOT NULL, "wallet_to_withdraw" character varying NOT NULL, "withdraw_amount" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "creditLineIdId" integer, CONSTRAINT "PK_02e70a169eff16575401fe2239a" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_02e70a169eff16575401fe2239" ON "withdraw_request" ("id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."deposit_request_deposit_request_status_enum" AS ENUM('PENDING')`
        );
        await queryRunner.query(
            `CREATE TABLE "deposit_request" ("id" SERIAL NOT NULL, "deposit_request_status" "public"."deposit_request_deposit_request_status_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "creditLineIdId" integer, CONSTRAINT "PK_0a98eb3dce48bdbd881be8e0dfe" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_0a98eb3dce48bdbd881be8e0df" ON "deposit_request" ("id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."borrow_request_borrow_request_status_enum" AS ENUM('PENDING')`
        );
        await queryRunner.query(
            `CREATE TABLE "borrow_request" ("id" SERIAL NOT NULL, "borrow_request_status" "public"."borrow_request_borrow_request_status_enum" NOT NULL, "borrow_fiat_amount" numeric(78) NOT NULL, "initial_risk_startegy" numeric(78) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "creditLineIdId" integer, CONSTRAINT "PK_ead119ab91cdfd75fbde173c701" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_ead119ab91cdfd75fbde173c70" ON "borrow_request" ("id") `
        );
        await queryRunner.query(
            `CREATE TABLE "buisiness_payment_requisite" ("id" SERIAL NOT NULL, "bank_name" character varying NOT NULL, "iban" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "currencyIdId" integer, CONSTRAINT "PK_6ea829f9b04251b217955e6e1ed" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_6ea829f9b04251b217955e6e1e" ON "buisiness_payment_requisite" ("id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."repay_request_repay_request_status_enum" AS ENUM('PENDING')`
        );
        await queryRunner.query(
            `CREATE TABLE "repay_request" ("id" SERIAL NOT NULL, "repay_request_status" "public"."repay_request_repay_request_status_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "creditLineIdId" integer, "buisinessPaymentRequisiteIdId" integer, CONSTRAINT "PK_9d2f9f273ce084d1577149c5306" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_9d2f9f273ce084d1577149c530" ON "repay_request" ("id") `
        );
        await queryRunner.query(
            `CREATE TABLE "crypto_transaction" ("id" SERIAL NOT NULL, "from" character varying NOT NULL, "to" character varying NOT NULL, "raw_transfer_amount" numeric(78) NOT NULL, "usd_transfer_amount" numeric(78) NOT NULL, "tx_hash" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "withdrawRequestIdId" integer, "depositRequestIdId" integer, CONSTRAINT "PK_7107601dbf52f2f9d52d8890467" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_7107601dbf52f2f9d52d889046" ON "crypto_transaction" ("id") `
        );
        await queryRunner.query(
            `CREATE TYPE "public"."fiat_transaction_status_enum" AS ENUM('PENDING', 'COMPLETED', 'REJECTED')`
        );
        await queryRunner.query(
            `CREATE TABLE "fiat_transaction" ("id" SERIAL NOT NULL, "iban_from" character varying NOT NULL, "iban_to" character varying NOT NULL, "name_from" character varying NOT NULL, "name_to" character varying NOT NULL, "raw_transfer_amount" numeric(78) NOT NULL, "status" "public"."fiat_transaction_status_enum" NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "borrowRequestIdId" integer, "repayRequestIdId" integer, CONSTRAINT "PK_1a9da62b254ccdd8681a9ab4bc0" PRIMARY KEY ("id"))`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_1a9da62b254ccdd8681a9ab4bc" ON "fiat_transaction" ("id") `
        );
        await queryRunner.query(`ALTER TABLE "operator" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "session" ADD "chat_id" integer`);
        await queryRunner.query(
            `ALTER TABLE "session" ADD CONSTRAINT "UQ_2b65f9d03fa316e7525f028b6d2" UNIQUE ("chat_id")`
        );
        await queryRunner.query(`ALTER TABLE "operator" DROP COLUMN "created_at"`);
        await queryRunner.query(
            `ALTER TABLE "operator" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(`ALTER TABLE "operator" DROP COLUMN "updated_at"`);
        await queryRunner.query(
            `ALTER TABLE "operator" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "created_at"`);
        await queryRunner.query(
            `ALTER TABLE "session" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "updated_at"`);
        await queryRunner.query(
            `ALTER TABLE "session" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_8b950e1572745d9f69be7748ae" ON "operator" ("id") `
        );
        await queryRunner.query(
            `CREATE UNIQUE INDEX "IDX_f55da76ac1c3ac420f444d2ff1" ON "session" ("id") `
        );
        await queryRunner.query(
            `ALTER TABLE "session" ADD CONSTRAINT "FK_2b65f9d03fa316e7525f028b6d2" FOREIGN KEY ("chat_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ADD CONSTRAINT "FK_2f61a9d89ae982f47c2fe36537a" FOREIGN KEY ("userIdId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ADD CONSTRAINT "FK_dc7763a3fd20407d6f42d41d644" FOREIGN KEY ("currencyIdId") REFERENCES "debt_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD CONSTRAINT "FK_f0f0c798a5cabe2b7050094651c" FOREIGN KEY ("collateralCurrencyIdId") REFERENCES "collateral_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD CONSTRAINT "FK_09919c4f914eb76c136cb211239" FOREIGN KEY ("debtCurrencyIdId") REFERENCES "debt_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_73becab285e90673c778805acaf" FOREIGN KEY ("userPaymentRequisiteIdId") REFERENCES "user_payment_requisite"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_68005ed5c7b220e56b50d67d9de" FOREIGN KEY ("userIdId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_d9137d13492d8a15d3401b5cfc7" FOREIGN KEY ("economicalParametersIdId") REFERENCES "economical_parameters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_edbf9d4dc66cafd389c2d994fa2" FOREIGN KEY ("debtCurrencyIdId") REFERENCES "debt_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_431e101bdc8596f270330096e7a" FOREIGN KEY ("collateralCurrencyIdId") REFERENCES "collateral_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ADD CONSTRAINT "FK_4da7e09b7d8146a203901d61b14" FOREIGN KEY ("creditLineIdId") REFERENCES "credit_line"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" ADD CONSTRAINT "FK_47c0cda363760fda5b3a1bd38a6" FOREIGN KEY ("creditLineIdId") REFERENCES "credit_line"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ADD CONSTRAINT "FK_dcba8a4fb6f2d484bae99e52427" FOREIGN KEY ("creditLineIdId") REFERENCES "credit_line"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "buisiness_payment_requisite" ADD CONSTRAINT "FK_e346ee6a1645892296b9e37b1ef" FOREIGN KEY ("currencyIdId") REFERENCES "debt_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_5dd332b7f99ac2bf0bcedcd1786" FOREIGN KEY ("creditLineIdId") REFERENCES "credit_line"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_17e27d08bf00143a222c5be50e9" FOREIGN KEY ("buisinessPaymentRequisiteIdId") REFERENCES "buisiness_payment_requisite"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" ADD CONSTRAINT "FK_29d1757558fe3e2e724e61a5ae6" FOREIGN KEY ("withdrawRequestIdId") REFERENCES "withdraw_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" ADD CONSTRAINT "FK_c42500af48351174ea495cf57d2" FOREIGN KEY ("depositRequestIdId") REFERENCES "deposit_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" ADD CONSTRAINT "FK_bb6563471032162cd561916da24" FOREIGN KEY ("borrowRequestIdId") REFERENCES "borrow_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" ADD CONSTRAINT "FK_51c9b626cc91dc575c04f1f6a25" FOREIGN KEY ("repayRequestIdId") REFERENCES "repay_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" DROP CONSTRAINT "FK_51c9b626cc91dc575c04f1f6a25"`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" DROP CONSTRAINT "FK_bb6563471032162cd561916da24"`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" DROP CONSTRAINT "FK_c42500af48351174ea495cf57d2"`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" DROP CONSTRAINT "FK_29d1757558fe3e2e724e61a5ae6"`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP CONSTRAINT "FK_17e27d08bf00143a222c5be50e9"`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP CONSTRAINT "FK_5dd332b7f99ac2bf0bcedcd1786"`
        );
        await queryRunner.query(
            `ALTER TABLE "buisiness_payment_requisite" DROP CONSTRAINT "FK_e346ee6a1645892296b9e37b1ef"`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" DROP CONSTRAINT "FK_dcba8a4fb6f2d484bae99e52427"`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" DROP CONSTRAINT "FK_47c0cda363760fda5b3a1bd38a6"`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" DROP CONSTRAINT "FK_4da7e09b7d8146a203901d61b14"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_431e101bdc8596f270330096e7a"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_edbf9d4dc66cafd389c2d994fa2"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_d9137d13492d8a15d3401b5cfc7"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_68005ed5c7b220e56b50d67d9de"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_73becab285e90673c778805acaf"`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP CONSTRAINT "FK_09919c4f914eb76c136cb211239"`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP CONSTRAINT "FK_f0f0c798a5cabe2b7050094651c"`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" DROP CONSTRAINT "FK_dc7763a3fd20407d6f42d41d644"`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" DROP CONSTRAINT "FK_2f61a9d89ae982f47c2fe36537a"`
        );
        await queryRunner.query(
            `ALTER TABLE "session" DROP CONSTRAINT "FK_2b65f9d03fa316e7525f028b6d2"`
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_f55da76ac1c3ac420f444d2ff1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b950e1572745d9f69be7748ae"`);
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "updated_at"`);
        await queryRunner.query(
            `ALTER TABLE "session" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone`
        );
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "created_at"`);
        await queryRunner.query(
            `ALTER TABLE "session" ADD "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone`
        );
        await queryRunner.query(`ALTER TABLE "operator" DROP COLUMN "updated_at"`);
        await queryRunner.query(
            `ALTER TABLE "operator" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone`
        );
        await queryRunner.query(`ALTER TABLE "operator" DROP COLUMN "created_at"`);
        await queryRunner.query(
            `ALTER TABLE "operator" ADD "created_at" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone`
        );
        await queryRunner.query(
            `ALTER TABLE "session" DROP CONSTRAINT "UQ_2b65f9d03fa316e7525f028b6d2"`
        );
        await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "chat_id"`);
        await queryRunner.query(`ALTER TABLE "session" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "operator" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1a9da62b254ccdd8681a9ab4bc"`);
        await queryRunner.query(`DROP TABLE "fiat_transaction"`);
        await queryRunner.query(`DROP TYPE "public"."fiat_transaction_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7107601dbf52f2f9d52d889046"`);
        await queryRunner.query(`DROP TABLE "crypto_transaction"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d2f9f273ce084d1577149c530"`);
        await queryRunner.query(`DROP TABLE "repay_request"`);
        await queryRunner.query(`DROP TYPE "public"."repay_request_repay_request_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ea829f9b04251b217955e6e1e"`);
        await queryRunner.query(`DROP TABLE "buisiness_payment_requisite"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ead119ab91cdfd75fbde173c70"`);
        await queryRunner.query(`DROP TABLE "borrow_request"`);
        await queryRunner.query(`DROP TYPE "public"."borrow_request_borrow_request_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0a98eb3dce48bdbd881be8e0df"`);
        await queryRunner.query(`DROP TABLE "deposit_request"`);
        await queryRunner.query(`DROP TYPE "public"."deposit_request_deposit_request_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02e70a169eff16575401fe2239"`);
        await queryRunner.query(`DROP TABLE "withdraw_request"`);
        await queryRunner.query(`DROP TYPE "public"."withdraw_request_withdraw_request_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_18a28cc8a224fc38c84c53e95b"`);
        await queryRunner.query(`DROP TABLE "credit_line"`);
        await queryRunner.query(`DROP TYPE "public"."credit_line_credit_line_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bdc29d32c7917a436a1becf275"`);
        await queryRunner.query(`DROP TABLE "economical_parameters"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6b8457544d481e8189a01c220b"`);
        await queryRunner.query(`DROP TABLE "user_payment_requisite"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2b8b2813e4473dad6090c333b7"`);
        await queryRunner.query(`DROP TABLE "collateral_currency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8860676b38b769d61ecbe796aa"`);
        await queryRunner.query(`DROP TABLE "debt_currency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cace4a159ff9f2512dd4237376"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(
            `CREATE INDEX "IDX_b87fa13294d244adbfcba07c8c" ON "operator" ("id", "username") `
        );
    }
}
