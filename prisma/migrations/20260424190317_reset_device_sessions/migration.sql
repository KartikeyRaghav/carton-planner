-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetDeviceToken" TEXT,
ADD COLUMN     "resetDeviceTokenExpiry" TIMESTAMP(3);
