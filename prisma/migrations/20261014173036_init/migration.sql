/*
  Warnings:

  - You are about to drop the column `batchNo` on the `transaction_info` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `transaction_info` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `transaction_info_batchNo_key` ON `transaction_info`;

-- AlterTable
ALTER TABLE `transaction_info` DROP COLUMN `batchNo`,
    DROP COLUMN `status`;

-- CreateTable
CREATE TABLE `ProductionItemInfo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `batchNo` VARCHAR(50) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'IN_PROGRESS', 'COMPLETE', 'DELETE') NOT NULL DEFAULT 'PROCESSING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProductionItemInfo_transactionId_key`(`transactionId`),
    UNIQUE INDEX `ProductionItemInfo_batchNo_key`(`batchNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductionItemInfo` ADD CONSTRAINT `ProductionItemInfo_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transaction_info`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
