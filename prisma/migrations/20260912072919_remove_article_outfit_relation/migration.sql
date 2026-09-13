/*
  Warnings:

  - You are about to drop the column `outfitId` on the `articles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_outfitId_fkey";

-- AlterTable
ALTER TABLE "articles" DROP COLUMN "outfitId";
