-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "WishlistStatus" AS ENUM ('PLANNED', 'PURCHASED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('INFO', 'WARNING', 'RECOMMENDATION');

-- CreateEnum
CREATE TYPE "InsightPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(45) NOT NULL,
    "email" VARCHAR(45) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "avatar_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "finance" (
    "finance_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "monthly_income" DECIMAL(15,2) NOT NULL,
    "savings_target" DECIMAL(15,2) NOT NULL,
    "daily_spending_limit" DECIMAL(15,2) NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,

    CONSTRAINT "finance_pkey" PRIMARY KEY ("finance_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "category_id" SERIAL NOT NULL,
    "category_name" VARCHAR(45) NOT NULL,
    "icon_name" VARCHAR(45),
    "type" "CategoryType" NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "transaction_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "is_fixed_expense" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "attachment_url" VARCHAR(255),
    "transaction_date" DATE NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "wishlist" (
    "wishlist_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "item_name" VARCHAR(45) NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "priority_level" INTEGER NOT NULL,
    "status" "WishlistStatus" NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_pkey" PRIMARY KEY ("wishlist_id")
);

-- CreateTable
CREATE TABLE "split_bill" (
    "split_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "total_people" INTEGER NOT NULL,
    "amount_per_person" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "split_bill_pkey" PRIMARY KEY ("split_id")
);

-- CreateTable
CREATE TABLE "insight" (
    "insight_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "priority" "InsightPriority" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InsightStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "insight_pkey" PRIMARY KEY ("insight_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "finance_user_id_idx" ON "finance"("user_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");

-- CreateIndex
CREATE INDEX "transactions_transaction_date_idx" ON "transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "wishlist_user_id_idx" ON "wishlist"("user_id");

-- CreateIndex
CREATE INDEX "split_bill_user_id_idx" ON "split_bill"("user_id");

-- CreateIndex
CREATE INDEX "insight_user_id_idx" ON "insight"("user_id");

-- AddForeignKey
ALTER TABLE "finance" ADD CONSTRAINT "finance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_bill" ADD CONSTRAINT "split_bill_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight" ADD CONSTRAINT "insight_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

