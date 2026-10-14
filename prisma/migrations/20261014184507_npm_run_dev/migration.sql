-- AddForeignKey
ALTER TABLE `ProductionItemInfo` ADD CONSTRAINT `ProductionItemInfo_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
