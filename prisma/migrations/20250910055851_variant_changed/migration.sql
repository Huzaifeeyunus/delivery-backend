/*
  Warnings:

  - A unique constraint covering the columns `[productId,colorId]` on the table `productvariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productVariantId,sizeId]` on the table `productvariant_size` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `productimage` DROP FOREIGN KEY `productimage_productId_fkey`;

-- DropForeignKey
ALTER TABLE `productimage` DROP FOREIGN KEY `productimage_productVariantId_fkey`;

-- AlterTable
ALTER TABLE `productimage` ADD COLUMN `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `position` INTEGER NULL;

-- AlterTable
ALTER TABLE `productvariant` ADD COLUMN `SKU` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `productvariant_productId_colorId_key` ON `productvariant`(`productId`, `colorId`);

-- CreateIndex
CREATE UNIQUE INDEX `productvariant_size_productVariantId_sizeId_key` ON `productvariant_size`(`productVariantId`, `sizeId`);

-- AddForeignKey
ALTER TABLE `productimage` ADD CONSTRAINT `productimage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productimage` ADD CONSTRAINT `productimage_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `productvariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `productvariant` RENAME INDEX `productvariant_colorId_fkey` TO `productvariant_colorId_idx`;

-- RenameIndex
ALTER TABLE `productvariant_size` RENAME INDEX `productvariant_size_sizeId_fkey` TO `productvariant_size_sizeId_idx`;
