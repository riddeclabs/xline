import { MigrationInterface, QueryRunner } from "typeorm";

export class AddForeignKeysToEntity1686577430801 implements MigrationInterface {
    name = "AddForeignKeysToEntity1686577430801";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "crypto_transaction" DROP COLUMN "from"`);
        await queryRunner.query(`ALTER TABLE "crypto_transaction" DROP COLUMN "to"`);
        await queryRunner.query(`ALTER TABLE "payment_processing" DROP COLUMN "origin_name"`);
        await queryRunner.query(`ALTER TABLE "payment_processing" DROP COLUMN "callback_auth"`);
        await queryRunner.query(`ALTER TABLE "payment_processing" DROP COLUMN "gateway_auth"`);
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" ADD "payment_processing_tx_id" character varying NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" DROP CONSTRAINT "FK_1ab6832b92a92477ca30192a480"`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "credit_line_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "fiat_transaction" ALTER COLUMN "status" SET DEFAULT 'PENDING'`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP CONSTRAINT "FK_bb1e26681a7e84f03ba7b692590"`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" DROP CONSTRAINT "FK_039974bd21cd9d7c699aac1fca5"`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ALTER COLUMN "credit_line_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ALTER COLUMN "business_payment_requisite_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "business_payment_requisite" DROP CONSTRAINT "FK_dfa789b8b8f5d1a8563cb4a98df"`
        );
        await queryRunner.query(
            `ALTER TABLE "business_payment_requisite" ALTER COLUMN "debt_currency_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP CONSTRAINT "FK_a029c8380f21741b3876591ce4f"`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" DROP CONSTRAINT "FK_2052e37eb91c402f70df04755c2"`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ALTER COLUMN "collateral_currency_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ALTER COLUMN "debt_currency_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "debt_currency" ADD CONSTRAINT "UQ_2b93187fc0f31385caf1df6b04e" UNIQUE ("symbol")`
        );
        await queryRunner.query(
            `ALTER TABLE "collateral_currency" ADD CONSTRAINT "UQ_1244cd616978f6c56014760c704" UNIQUE ("symbol")`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" DROP CONSTRAINT "FK_c521a1086c3777b1ad9fe7fadab"`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" DROP CONSTRAINT "FK_b8bf3843ac39f71396464d14768"`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ALTER COLUMN "user_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ALTER COLUMN "debt_currency_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" DROP CONSTRAINT "FK_637a8dce31f57b1f78ca514519f"`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" ALTER COLUMN "credit_line_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" DROP CONSTRAINT "FK_60a1dfcf5d844760d58797b65bf"`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ALTER COLUMN "credit_line_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_286dcb0f5af72994bf411bb71a6"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_64539eea5c63d00bfa3c34ecf74"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_cc806b89dec6e8f11f1c04dd871"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_2bc37ae5367ca1037d81361b265"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "FK_826ba1567248dea33d23686d17c"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ALTER COLUMN "user_payment_requisite_id" SET NOT NULL`
        );
        await queryRunner.query(`ALTER TABLE "credit_line" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "credit_line" ALTER COLUMN "economical_parameters_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ALTER COLUMN "debt_currency_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ALTER COLUMN "collateral_currency_id" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "UQ_8e3cda0fbb42a9266d7e92b831d" UNIQUE ("ref_number")`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ADD CONSTRAINT "FK_1ab6832b92a92477ca30192a480" FOREIGN KEY ("credit_line_id") REFERENCES "credit_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
            `ALTER TABLE "borrow_request" DROP CONSTRAINT "FK_1ab6832b92a92477ca30192a480"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" DROP CONSTRAINT "UQ_8e3cda0fbb42a9266d7e92b831d"`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ALTER COLUMN "collateral_currency_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ALTER COLUMN "debt_currency_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ALTER COLUMN "economical_parameters_id" DROP NOT NULL`
        );
        await queryRunner.query(`ALTER TABLE "credit_line" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "credit_line" ALTER COLUMN "user_payment_requisite_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_826ba1567248dea33d23686d17c" FOREIGN KEY ("collateral_currency_id") REFERENCES "collateral_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_2bc37ae5367ca1037d81361b265" FOREIGN KEY ("debt_currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_cc806b89dec6e8f11f1c04dd871" FOREIGN KEY ("economical_parameters_id") REFERENCES "economical_parameters"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_64539eea5c63d00bfa3c34ecf74" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "credit_line" ADD CONSTRAINT "FK_286dcb0f5af72994bf411bb71a6" FOREIGN KEY ("user_payment_requisite_id") REFERENCES "user_payment_requisite"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ALTER COLUMN "credit_line_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ADD CONSTRAINT "FK_60a1dfcf5d844760d58797b65bf" FOREIGN KEY ("credit_line_id") REFERENCES "credit_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" ALTER COLUMN "credit_line_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "deposit_request" ADD CONSTRAINT "FK_637a8dce31f57b1f78ca514519f" FOREIGN KEY ("credit_line_id") REFERENCES "credit_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ALTER COLUMN "debt_currency_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ALTER COLUMN "user_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ADD CONSTRAINT "FK_b8bf3843ac39f71396464d14768" FOREIGN KEY ("debt_currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "user_payment_requisite" ADD CONSTRAINT "FK_c521a1086c3777b1ad9fe7fadab" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "collateral_currency" DROP CONSTRAINT "UQ_1244cd616978f6c56014760c704"`
        );
        await queryRunner.query(
            `ALTER TABLE "debt_currency" DROP CONSTRAINT "UQ_2b93187fc0f31385caf1df6b04e"`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ALTER COLUMN "debt_currency_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ALTER COLUMN "collateral_currency_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD CONSTRAINT "FK_2052e37eb91c402f70df04755c2" FOREIGN KEY ("debt_currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "economical_parameters" ADD CONSTRAINT "FK_a029c8380f21741b3876591ce4f" FOREIGN KEY ("collateral_currency_id") REFERENCES "collateral_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "business_payment_requisite" ALTER COLUMN "debt_currency_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "business_payment_requisite" ADD CONSTRAINT "FK_dfa789b8b8f5d1a8563cb4a98df" FOREIGN KEY ("debt_currency_id") REFERENCES "debt_currency"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ALTER COLUMN "business_payment_requisite_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ALTER COLUMN "credit_line_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_039974bd21cd9d7c699aac1fca5" FOREIGN KEY ("business_payment_requisite_id") REFERENCES "business_payment_requisite"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "repay_request" ADD CONSTRAINT "FK_bb1e26681a7e84f03ba7b692590" FOREIGN KEY ("credit_line_id") REFERENCES "credit_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(`ALTER TABLE "fiat_transaction" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "credit_line_id" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ADD CONSTRAINT "FK_1ab6832b92a92477ca30192a480" FOREIGN KEY ("credit_line_id") REFERENCES "credit_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
        );
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" DROP COLUMN "payment_processing_tx_id"`
        );
        await queryRunner.query(
            `ALTER TABLE "payment_processing" ADD "gateway_auth" character varying NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "payment_processing" ADD "callback_auth" character varying NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "payment_processing" ADD "origin_name" character varying NOT NULL`
        );
        await queryRunner.query(`ALTER TABLE "crypto_transaction" ADD "to" character varying NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "crypto_transaction" ADD "from" character varying NOT NULL`
        );
    }
}
