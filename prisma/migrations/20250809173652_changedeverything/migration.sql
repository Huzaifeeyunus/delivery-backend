/*
  Warnings:

  - You are about to drop the column `colorId` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `sizeId` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `tagId` on the `product` table. All the data in the column will be lost.
  - Added the required column `ProductVariantId` to the `ProductImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_colorId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_sizeId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `Product_tagId_fkey`;

-- DropIndex
DROP INDEX `Product_SKU_key` ON `product`;

-- DropIndex
DROP INDEX `Product_colorId_fkey` ON `product`;

-- DropIndex
DROP INDEX `Product_sizeId_fkey` ON `product`;

-- DropIndex
DROP INDEX `Product_tagId_fkey` ON `product`;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `colorId`,
    DROP COLUMN `sizeId`,
    DROP COLUMN `tagId`,
    ADD COLUMN `tag` VARCHAR(191) NULL,
    MODIFY `SKU` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `productimage` ADD COLUMN `ProductVariantId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `productvariant` ADD COLUMN `available` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `barcode` VARCHAR(191) NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `discountPrice` DOUBLE NULL,
    ADD COLUMN `stockStatus` VARCHAR(191) NOT NULL DEFAULT 'In Stock',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `color` VARCHAR(191) NULL,
    MODIFY `size` VARCHAR(191) NULL,
    MODIFY `SKU` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `ProductImage` ADD CONSTRAINT `ProductImage_ProductVariantId_fkey` FOREIGN KEY (`ProductVariantId`) REFERENCES `ProductVariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
