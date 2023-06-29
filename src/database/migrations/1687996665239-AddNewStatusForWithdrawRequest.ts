import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewStatusForWithdrawRequest1687996665239 implements MigrationInterface {
    name = "AddNewStatusForWithdrawRequest1687996665239";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."withdraw_request_withdraw_request_status_enum" RENAME TO "withdraw_request_withdraw_request_status_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."withdraw_request_withdraw_request_status_enum" AS ENUM('PENDING', 'FINISHED', 'REJECTED', 'UNSUCCESSFUL_PAYMENT_PROCESSING_REQUEST')`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ALTER COLUMN "withdraw_request_status" DROP DEFAULT`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ALTER COLUMN "withdraw_request_status" TYPE "public"."withdraw_request_withdraw_request_status_enum" USING "withdraw_request_status"::"text"::"public"."withdraw_request_withdraw_request_status_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ALTER COLUMN "withdraw_request_status" SET DEFAULT 'PENDING'`
        );
        await queryRunner.query(
            `DROP TYPE "public"."withdraw_request_withdraw_request_status_enum_old"`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."withdraw_request_withdraw_request_status_enum_old" AS ENUM('PENDING', 'FINISHED', 'REJECTED')`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ALTER COLUMN "withdraw_request_status" DROP DEFAULT`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ALTER COLUMN "withdraw_request_status" TYPE "public"."withdraw_request_withdraw_request_status_enum_old" USING "withdraw_request_status"::"text"::"public"."withdraw_request_withdraw_request_status_enum_old"`
        );
        await queryRunner.query(
            `ALTER TABLE "withdraw_request" ALTER COLUMN "withdraw_request_status" SET DEFAULT 'PENDING'`
        );
        await queryRunner.query(`DROP TYPE "public"."withdraw_request_withdraw_request_status_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."withdraw_request_withdraw_request_status_enum_old" RENAME TO "withdraw_request_withdraw_request_status_enum"`
        );
    }
}
