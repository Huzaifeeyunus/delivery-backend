/*
  Warnings:

  - You are about to drop the column `brand` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `origin` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `tag` table. All the data in the column will be lost.
  - Added the required column `brandId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `colorId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Made the column `longDescription` on table `product` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `tag` DROP FOREIGN KEY `Tag_productId_fkey`;

-- DropIndex
DROP INDEX `Tag_productId_fkey` ON `tag`;

-- AlterTable
ALTER TABLE `product` DROP COLUMN `brand`,
    DROP COLUMN `color`,
    DROP COLUMN `material`,
    DROP COLUMN `origin`,
    DROP COLUMN `size`,
    ADD COLUMN `brandId` INTEGER NOT NULL,
    ADD COLUMN `colorId` INTEGER NOT NULL,
    ADD COLUMN `materialId` INTEGER NOT NULL,
    ADD COLUMN `originId` INTEGER NOT NULL,
    ADD COLUMN `sizeId` INTEGER NOT NULL,
    ADD COLUMN `tagId` INTEGER NOT NULL,
    MODIFY `longDescription` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `tag` DROP COLUMN `productId`;

-- CreateTable
CREATE TABLE `Brand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brand` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Material` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `material` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Origin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `origin` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Color` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `color` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Size` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `size` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `Material`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_originId_fkey` FOREIGN KEY (`originId`) REFERENCES `Origin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `Color`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `Size`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
