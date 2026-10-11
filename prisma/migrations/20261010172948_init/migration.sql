/*
  Warnings:

  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.
  - The values [CHECKED,CLOSED,CONVERTED] on the enum `pm_inventories_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `bank_accounts` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `employees` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `inventories` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `packing_materials` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `pm_inventories` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `products` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `purchase_order_info` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `purchase_order_inventory` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `raw_materials` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `transaction_info` ADD COLUMN `status` ENUM('PENDING', 'INPGRESS', 'COMPLETE', 'DELETE', 'PUSH') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `user` MODIFY `status` ENUM('ACTIVE', 'DELETED', 'PUSH', 'BLOCK', 'PENDING') NOT NULL DEFAULT 'ACTIVE';
