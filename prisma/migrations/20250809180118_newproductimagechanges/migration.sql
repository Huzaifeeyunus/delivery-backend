-- DropForeignKey
ALTER TABLE `productimage` DROP FOREIGN KEY `ProductImage_ProductVariantId_fkey`;

-- DropIndex
DROP INDEX `ProductImage_ProductVariantId_fkey` ON `productimage`;

-- AlterTable
ALTER TABLE `productimage` MODIFY `ProductVariantId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_ProductVariantId_fkey` FOREIGN KEY (`ProductVariantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
