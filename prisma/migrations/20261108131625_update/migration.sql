/*
  Warnings:

  - You are about to drop the `productionexpenseitem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ingredient_expnese` DROP FOREIGN KEY `ingredient_expnese_productionExpenssItemId_fkey`;

-- DropForeignKey
ALTER TABLE `production_expences_inventory` DROP FOREIGN KEY `production_expences_inventory_proExpencesItemId_fkey`;

-- DropTable
DROP TABLE `productionexpenseitem`;

-- CreateTable
CREATE TABLE `Productionexpenseitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `expItemName` VARCHAR(191) NOT NULL,
    `unitRate` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ingredient_expnese` ADD CONSTRAINT `ingredient_expnese_productionExpenssItemId_fkey` FOREIGN KEY (`productionExpenssItemId`) REFERENCES `Productionexpenseitem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `production_expences_inventory` ADD CONSTRAINT `production_expences_inventory_proExpencesItemId_fkey` FOREIGN KEY (`proExpencesItemId`) REFERENCES `Productionexpenseitem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
