import { MigrationInterface, QueryRunner } from "typeorm";

export class BorrowRequestStatus1686833303368 implements MigrationInterface {
    name = "BorrowRequestStatus1686833303368";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."borrow_request_borrow_request_status_enum" RENAME TO "borrow_request_borrow_request_status_enum_old"`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."borrow_request_borrow_request_status_enum" AS ENUM('WAITING_FOR_DEPOSIT', 'VERIFICATION_PENDING', 'MONEY_SENT', 'FINISHED', 'REJECTED')`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "borrow_request_status" DROP DEFAULT`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "borrow_request_status" TYPE "public"."borrow_request_borrow_request_status_enum" USING "borrow_request_status"::"text"::"public"."borrow_request_borrow_request_status_enum"`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "borrow_request_status" SET DEFAULT 'VERIFICATION_PENDING'`
        );
        await queryRunner.query(`DROP TYPE "public"."borrow_request_borrow_request_status_enum_old"`);
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "initial_risk_strategy" TYPE numeric(78)`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "initial_risk_strategy" TYPE numeric`
        );
        await queryRunner.query(
            `CREATE TYPE "public"."borrow_request_borrow_request_status_enum_old" AS ENUM('VERIFICATION_PENDING', 'MONEY_SENT', 'FINISHED', 'REJECTED')`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "borrow_request_status" DROP DEFAULT`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "borrow_request_status" TYPE "public"."borrow_request_borrow_request_status_enum_old" USING "borrow_request_status"::"text"::"public"."borrow_request_borrow_request_status_enum_old"`
        );
        await queryRunner.query(
            `ALTER TABLE "borrow_request" ALTER COLUMN "borrow_request_status" SET DEFAULT 'VERIFICATION_PENDING'`
        );
        await queryRunner.query(`DROP TYPE "public"."borrow_request_borrow_request_status_enum"`);
        await queryRunner.query(
            `ALTER TYPE "public"."borrow_request_borrow_request_status_enum_old" RENAME TO "borrow_request_borrow_request_status_enum"`
        );
    }
}
