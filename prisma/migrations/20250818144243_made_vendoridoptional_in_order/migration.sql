-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `Order_vendorId_fkey`;

-- DropIndex
DROP INDEX `Order_vendorId_fkey` ON `order`;

-- AlterTable
ALTER TABLE `order` MODIFY `vendorId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
