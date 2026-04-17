/*
  Warnings:

  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `finance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `insight` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `split_bill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wishlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."finance" DROP CONSTRAINT "finance_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."insight" DROP CONSTRAINT "insight_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."split_bill" DROP CONSTRAINT "split_bill_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."transactions" DROP CONSTRAINT "transactions_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."transactions" DROP CONSTRAINT "transactions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."wishlist" DROP CONSTRAINT "wishlist_user_id_fkey";

-- DropTable
DROP TABLE "public"."categories";

-- DropTable
DROP TABLE "public"."finance";

-- DropTable
DROP TABLE "public"."insight";

-- DropTable
DROP TABLE "public"."split_bill";

-- DropTable
DROP TABLE "public"."transactions";

-- DropTable
DROP TABLE "public"."users";

-- DropTable
DROP TABLE "public"."wishlist";

-- DropEnum
DROP TYPE "public"."CategoryType";

-- DropEnum
DROP TYPE "public"."InsightPriority";

-- DropEnum
DROP TYPE "public"."InsightStatus";

-- DropEnum
DROP TYPE "public"."InsightType";

-- DropEnum
DROP TYPE "public"."TransactionType";

-- DropEnum
DROP TYPE "public"."WishlistStatus";
