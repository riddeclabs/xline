import { MigrationInterface, QueryRunner } from "typeorm";

export class TwoWayRelations1683543977593 implements MigrationInterface {
    name = "TwoWayRelations1683543977593";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "borrow_request" DROP CONSTRAINT "FK_dcba8a4fb6f2d484bae99e52427"`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" DROP CONSTRAINT "FK_51c9b626cc91dc575c04f1f6a25"`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" DROP CONSTRAINT "FK_bb6563471032162cd561916da24"`
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
            `ALTER TABLE "deposit_request" DROP CONSTRAINT "FK_47c0cda363760fda5b3a1bd38a6"`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" DROP CONSTRAINT "FK_c42500af48351174ea495cf57d2"`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" DROP CONSTRAINT "FK_29d1757558fe3e2e724e61a5ae6"`
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
            `ALTER TABLE "session" DROP CONSTRAINT "FK_2b65f9d03fa316e7525f028b6d2"`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" RENAME COLUMN "creditLineIdId" TO "credit_line_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "buisiness_payment_requisite" RENAME COLUMN "currencyIdId" TO "currency_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" RENAME COLUMN "creditLineIdId" TO "credit_line_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" RENAME COLUMN "creditLineIdId" TO "credit_line_id"`
        );
        await queryRunner.query(`ALTER TABLE "fiat_transaction" DROP COLUMN "borrowRequestIdId"`);
        await queryRunner.query(`ALTER TABLE "fiat_transaction" DROP COLUMN "repayRequestIdId"`);
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP COLUMN "buisinessPaymentRequisiteIdId"`
        );
        await queryRunner.query(`ALTER TABLE "repay_request" DROP COLUMN "creditLineIdId"`);
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP COLUMN "collateralCurrencyIdId"`
        );
        await queryRunner.query(`ALTER TABLE "economical_parameters" DROP COLUMN "debtCurrencyIdId"`);
        await queryRunner.query(`ALTER TABLE "user_payment_requisite" DROP COLUMN "userIdId"`);
        await queryRunner.query(`ALTER TABLE "user_payment_requisite" DROP COLUMN "currencyIdId"`);
        await queryRunner.query(`ALTER TABLE "crypto_transaction" DROP COLUMN "withdrawRequestIdId"`);
        await queryRunner.query(`ALTER TABLE "crypto_transaction" DROP COLUMN "depositRequestIdId"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "userPaymentRequisiteIdId"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "userIdId"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "economicalParametersIdId"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "debtCurrencyIdId"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "collateralCurrencyIdId"`);
        await queryRunner.query(`ALTER TABLE "fiat_transaction" ADD "borrow_request_id" integer`);
        await queryRunner.query(`ALTER TABLE "fiat_transaction" ADD "repay_request_id" integer`);
        await queryRunner.query(`ALTER TABLE "repay_request" ADD "credit_line_id" integer`);
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD "buisiness_payment_requisite_id" integer`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD "collateral_currency_id" integer`
        );
        await queryRunner.query(`ALTER TABLE "economical_parameters" ADD "debt_currency_id" integer`);
        await queryRunner.query(`ALTER TABLE "user_payment_requisite" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "user_payment_requisite" ADD "currency_id" integer`);
        await queryRunner.query(`ALTER TABLE "crypto_transaction" ADD "withdraw_request_id" integer`);
        await queryRunner.query(`ALTER TABLE "crypto_transaction" ADD "deposit_request_id" integer`);
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD "gateway_user_id" character varying NOT NULL`
        );
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "user_payment_requisite_id" integer`);
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "economical_parameters_id" integer`);
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "debt_currency_id" integer`);
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "collateral_currency_id" integer`);
        await queryRunner.query(
            `ALTER TABLE "user" ADD CONSTRAINT "UQ_c43d9c7669f5c12f23686e1b891" UNIQUE ("chat_id")`
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
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_b80dffc35fa63a10911877d1006" FOREIGN KEY ("buisiness_payment_requisite_id") REFERENCES "buisiness_payment_requisite"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "buisiness_payment_requisite" ADD CONSTRAINT "FK_e9b3782519fa217ba574ee25488" FOREIGN KEY ("currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
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
            `ALTER TABLE "user_payment_requisite" ADD CONSTRAINT "FK_ae889f2e90563e4341fca594604" FOREIGN KEY ("currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
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
            `ALTER TABLE "session" ADD CONSTRAINT "FK_2b65f9d03fa316e7525f028b6d2" FOREIGN KEY ("chat_id") REFERENCES "user"("chat_id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "session" DROP CONSTRAINT "FK_2b65f9d03fa316e7525f028b6d2"`
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
            `ALTER TABLE "user_payment_requisite" DROP CONSTRAINT "FK_ae889f2e90563e4341fca594604"`
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
            `ALTER TABLE "buisiness_payment_requisite" DROP CONSTRAINT "FK_e9b3782519fa217ba574ee25488"`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP CONSTRAINT "FK_b80dffc35fa63a10911877d1006"`
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
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "UQ_c43d9c7669f5c12f23686e1b891"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "collateral_currency_id"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "debt_currency_id"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "economical_parameters_id"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "user_payment_requisite_id"`);
        await queryRunner.query(`ALTER TABLE "credit_line" DROP COLUMN "gateway_user_id"`);
        await queryRunner.query(`ALTER TABLE "crypto_transaction" DROP COLUMN "deposit_request_id"`);
        await queryRunner.query(`ALTER TABLE "crypto_transaction" DROP COLUMN "withdraw_request_id"`);
        await queryRunner.query(`ALTER TABLE "user_payment_requisite" DROP COLUMN "currency_id"`);
        await queryRunner.query(`ALTER TABLE "user_payment_requisite" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "economical_parameters" DROP COLUMN "debt_currency_id"`);
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP COLUMN "collateral_currency_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP COLUMN "buisiness_payment_requisite_id"`
        );
        await queryRunner.query(`ALTER TABLE "repay_request" DROP COLUMN "credit_line_id"`);
        await queryRunner.query(`ALTER TABLE "fiat_transaction" DROP COLUMN "repay_request_id"`);
        await queryRunner.query(`ALTER TABLE "fiat_transaction" DROP COLUMN "borrow_request_id"`);
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "collateralCurrencyIdId" integer`);
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "debtCurrencyIdId" integer`);
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "economicalParametersIdId" integer`);
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "userIdId" integer`);
        await queryRunner.query(`ALTER TABLE "credit_line" ADD "userPaymentRequisiteIdId" integer`);
        await queryRunner.query(`ALTER TABLE "crypto_transaction" ADD "depositRequestIdId" integer`);
        await queryRunner.query(`ALTER TABLE "crypto_transaction" ADD "withdrawRequestIdId" integer`);
        await queryRunner.query(`ALTER TABLE "user_payment_requisite" ADD "currencyIdId" integer`);
        await queryRunner.query(`ALTER TABLE "user_payment_requisite" ADD "userIdId" integer`);
        await queryRunner.query(`ALTER TABLE "economical_parameters" ADD "debtCurrencyIdId" integer`);
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD "collateralCurrencyIdId" integer`
        );
        await queryRunner.query(`ALTER TABLE "repay_request" ADD "creditLineIdId" integer`);
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD "buisinessPaymentRequisiteIdId" integer`
        );
        await queryRunner.query(`ALTER TABLE "fiat_transaction" ADD "repayRequestIdId" integer`);
        await queryRunner.query(`ALTER TABLE "fiat_transaction" ADD "borrowRequestIdId" integer`);
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" RENAME COLUMN "credit_line_id" TO "creditLineIdId"`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" RENAME COLUMN "credit_line_id" TO "creditLineIdId"`
        );
        await queryRunner.query(
            `ALTER TABLE "buisiness_payment_requisite" RENAME COLUMN "currency_id" TO "currencyIdId"`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" RENAME COLUMN "credit_line_id" TO "creditLineIdId"`
        );
        await queryRunner.query(
            `ALTER TABLE "session" ADD CONSTRAINT "FK_2b65f9d03fa316e7525f028b6d2" FOREIGN KEY ("chat_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
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
            `ALTER TABLE "crypto_transaction" ADD CONSTRAINT "FK_29d1757558fe3e2e724e61a5ae6" FOREIGN KEY ("withdrawRequestIdId") REFERENCES "withdraw_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" ADD CONSTRAINT "FK_c42500af48351174ea495cf57d2" FOREIGN KEY ("depositRequestIdId") REFERENCES "deposit_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" ADD CONSTRAINT "FK_47c0cda363760fda5b3a1bd38a6" FOREIGN KEY ("creditLineIdId") REFERENCES "credit_line"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
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
            `ALTER TABLE "buisiness_payment_requisite" ADD CONSTRAINT "FK_e346ee6a1645892296b9e37b1ef" FOREIGN KEY ("currencyIdId") REFERENCES "debt_currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_5dd332b7f99ac2bf0bcedcd1786" FOREIGN KEY ("creditLineIdId") REFERENCES "credit_line"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_17e27d08bf00143a222c5be50e9" FOREIGN KEY ("buisinessPaymentRequisiteIdId") REFERENCES "buisiness_payment_requisite"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" ADD CONSTRAINT "FK_bb6563471032162cd561916da24" FOREIGN KEY ("borrowRequestIdId") REFERENCES "borrow_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" ADD CONSTRAINT "FK_51c9b626cc91dc575c04f1f6a25" FOREIGN KEY ("repayRequestIdId") REFERENCES "repay_request"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ADD CONSTRAINT "FK_dcba8a4fb6f2d484bae99e52427" FOREIGN KEY ("creditLineIdId") REFERENCES "credit_line"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
    }
}
