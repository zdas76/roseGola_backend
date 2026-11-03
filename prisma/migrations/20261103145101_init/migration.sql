/*
  Warnings:

  - The values [RECEIPT] on the enum `transaction_info_voucherType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `transaction_info` MODIFY `voucherType` ENUM('SALES', 'PURCHASE', 'RECEIVED', 'PAYMENT', 'JOURNAL', 'CONTRA', 'PRODUCTION', 'REQUISITION', 'FINISH_GOODS') NOT NULL;
