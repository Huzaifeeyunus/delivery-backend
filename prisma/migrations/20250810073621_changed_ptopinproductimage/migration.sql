/*
  Warnings:

  - You are about to drop the column `ProductVariantId` on the `productimage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `productimage` DROP FOREIGN KEY `ProductImage_ProductVariantId_fkey`;

-- DropIndex
DROP INDEX `ProductImage_ProductVariantId_fkey` ON `productimage`;

-- AlterTable
ALTER TABLE `productimage` DROP COLUMN `ProductVariantId`,
    ADD COLUMN `productVariantId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
