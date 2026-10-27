/*
  Warnings:

  - You are about to drop the column `isOpening` on the `packing_materials` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `inventories` MODIFY `isOpening` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `packing_materials` DROP COLUMN `isOpening`;
