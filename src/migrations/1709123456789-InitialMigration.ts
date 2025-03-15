import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1709123456789 implements MigrationInterface {
    name = 'InitialMigration1709123456789'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUMs
        await queryRunner.query(`CREATE TYPE "user_role_enum" AS ENUM ('user', 'admin', 'super_admin')`);
        await queryRunner.query(`CREATE TYPE "transaction_type_enum" AS ENUM ('deposit', 'withdrawal', 'investment', 'return', 'purchase', 'bonus')`);
        await queryRunner.query(`CREATE TYPE "transaction_status_enum" AS ENUM ('pending', 'completed', 'failed', 'active')`);
        await queryRunner.query(`CREATE TYPE "investment_status_enum" AS ENUM ('active', 'completed', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "support_status_enum" AS ENUM ('open', 'in_progress', 'resolved', 'closed')`);

        // Create Users Table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "username" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "role" user_role_enum NOT NULL DEFAULT 'user',
                "is_active" boolean NOT NULL DEFAULT false,
                "verificationToken" character varying,
                "resetPasswordToken" character varying,
                "resetPasswordExpires" TIMESTAMP,
                "profile_completed" boolean NOT NULL DEFAULT false,
                "fullName" character varying,
                "phoneNumber" character varying,
                "address" character varying,
                "investment_balance" decimal(10,2) NOT NULL DEFAULT '0',
                "userIndex" integer,
                "adminIndex" integer,
                "bank_details" json,
                "crypto_wallets" json,
                "referral_code" character varying,
                "referred_by" uuid,
                "referral_earnings" decimal(10,2) NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_username" UNIQUE ("username"),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            )
        `);

        // Create Transactions Table
        await queryRunner.query(`
            CREATE TABLE "transactions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "type" transaction_type_enum NOT NULL,
                "amount" decimal(10,2) NOT NULL,
                "status" transaction_status_enum NOT NULL DEFAULT 'pending',
                "reference" character varying NOT NULL,
                "investment_details" json,
                "crypto_details" json,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_transactions_reference" UNIQUE ("reference"),
                CONSTRAINT "PK_transactions_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_transactions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id")
            )
        `);

        // Create Investments Table
        await queryRunner.query(`
            CREATE TABLE "investments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "amount" decimal(10,2) NOT NULL,
                "duration" integer NOT NULL,
                "returnRate" integer NOT NULL,
                "startDate" TIMESTAMP NOT NULL,
                "endDate" TIMESTAMP NOT NULL,
                "status" investment_status_enum NOT NULL DEFAULT 'active',
                "totalReturn" decimal(10,2) NOT NULL,
                "reference" character varying NOT NULL,
                "rewards" json NOT NULL,
                "stakingStartDate" TIMESTAMP NOT NULL,
                "stakingEndDate" TIMESTAMP NOT NULL,
                "isCompounding" boolean NOT NULL DEFAULT false,
                "earlyUnstakePenalty" decimal(10,2) NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_investments_reference" UNIQUE ("reference"),
                CONSTRAINT "PK_investments_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_investments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id")
            )
        `);

        // Create Support Table
        await queryRunner.query(`
            CREATE TABLE "support" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "subject" character varying NOT NULL,
                "message" text NOT NULL,
                "status" support_status_enum NOT NULL DEFAULT 'open',
                "attachments" text[] NOT NULL DEFAULT '{}',
                "replies" json[] NOT NULL DEFAULT '{}',
                "assigned_to" uuid,
                "is_priority" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_support_id" PRIMARY KEY ("id"),
                CONSTRAINT "FK_support_user" FOREIGN KEY ("user_id") REFERENCES "users"("id")
            )
        `);

        // Create Admin Invites Table
        await queryRunner.query(`
            CREATE TABLE "admin_invites" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "token" character varying NOT NULL,
                "role" user_role_enum NOT NULL DEFAULT 'admin',
                "expires" TIMESTAMP NOT NULL,
                "used" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_admin_invites_email" UNIQUE ("email"),
                CONSTRAINT "UQ_admin_invites_token" UNIQUE ("token"),
                CONSTRAINT "PK_admin_invites_id" PRIMARY KEY ("id")
            )
        `);

         // Create Notification Table
   
await queryRunner.query(`
    CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "investment_id" uuid,
        "transaction_id" uuid,
        "support_id" uuid,
        "admin_invite_id" uuid,
        "type" VARCHAR NOT NULL,
        "title" VARCHAR NOT NULL,
        "message" TEXT NOT NULL,
        "referenceId" VARCHAR,
        "metadata" JSONB,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_investment" FOREIGN KEY ("investment_id") REFERENCES "investments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_notifications_transaction" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_notifications_support" FOREIGN KEY ("support_id") REFERENCES "support"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_notifications_admin_invite" FOREIGN KEY ("admin_invite_id") REFERENCES "admin_invites"("id") ON DELETE SET NULL
    )
`);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "admin_invites"`);
        await queryRunner.query(`DROP TABLE "support"`);
        await queryRunner.query(`DROP TABLE "investments"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "support_status_enum"`);
        await queryRunner.query(`DROP TYPE "investment_status_enum"`);
        await queryRunner.query(`DROP TYPE "transaction_status_enum"`);
        await queryRunner.query(`DROP TYPE "transaction_type_enum"`);
        await queryRunner.query(`DROP TYPE "user_role_enum"`);
    }
}
