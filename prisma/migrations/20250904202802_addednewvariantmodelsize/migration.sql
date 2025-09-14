/*
  Warnings:

  - You are about to drop the column `SKU` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the column `available` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the column `barcode` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the column `discountPrice` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the column `stockStatus` on the `productvariant` table. All the data in the column will be lost.
  - Made the column `color` on table `productvariant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `productvariant` DROP COLUMN `SKU`,
    DROP COLUMN `available`,
    DROP COLUMN `barcode`,
    DROP COLUMN `discountPrice`,
    DROP COLUMN `price`,
    DROP COLUMN `size`,
    DROP COLUMN `stock`,
    DROP COLUMN `stockStatus`,
    MODIFY `color` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `productvariant_size` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productVariantId` INTEGER NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `SKU` VARCHAR(191) NULL,
    `stock` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `discountPrice` DOUBLE NULL,
    `available` BOOLEAN NOT NULL DEFAULT true,
    `stockStatus` VARCHAR(191) NOT NULL DEFAULT 'In Stock',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `productvariant_size_productVariantId_idx`(`productVariantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `productvariant_size` ADD CONSTRAINT `productvariant_size_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `productvariant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `productvariant` RENAME INDEX `productvariant_productId_fkey` TO `productvariant_productId_idx`;
