-- CreateEnum
CREATE TYPE "UserStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" "UserStatusEnum" NOT NULL DEFAULT 'ACTIVE';
