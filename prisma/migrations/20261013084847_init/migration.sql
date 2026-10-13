/*
  Warnings:

  - The values [PUSH] on the enum `transaction_info_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `transaction_info` MODIFY `status` ENUM('PENDING', 'PROCESSING', 'IN_PROGRESS', 'COMPLETE', 'DELETE') NOT NULL DEFAULT 'PENDING';
