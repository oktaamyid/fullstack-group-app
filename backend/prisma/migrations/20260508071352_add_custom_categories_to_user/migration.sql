-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customCategories" JSONB DEFAULT '{"EXPENSE": [], "INCOME": [], "categoryIcons": {}}';
