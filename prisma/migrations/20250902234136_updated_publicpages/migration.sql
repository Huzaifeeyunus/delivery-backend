/*
  Warnings:

  - You are about to drop the `publicoriginimage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `publicpageorigin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `order_vendorId_fkey`;

-- DropForeignKey
ALTER TABLE `publicoriginimage` DROP FOREIGN KEY `PublicOriginImage_pageOriginId_fkey`;

-- DropForeignKey
ALTER TABLE `publicpageorigin` DROP FOREIGN KEY `PublicPageOrigin_publicPageId_fkey`;

-- AlterTable
ALTER TABLE `order` MODIFY `vendorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `features` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `publicpage` ALTER COLUMN `isVisible` DROP DEFAULT,
    ALTER COLUMN `showInFooter` DROP DEFAULT,
    ALTER COLUMN `showInHeader` DROP DEFAULT;

-- AlterTable
ALTER TABLE `transaction` MODIFY `rawData` LONGTEXT NULL;

-- DropTable
DROP TABLE `publicoriginimage`;

-- DropTable
DROP TABLE `publicpageorigin`;

-- CreateTable
CREATE TABLE `originimage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NOT NULL,
    `pageOriginId` INTEGER NOT NULL,

    INDEX `OriginImage_pageOriginId_fkey`(`pageOriginId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pageorigin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `publicPageId` INTEGER NOT NULL,

    INDEX `PageOrigin_publicPageId_fkey`(`publicPageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `originimage` ADD CONSTRAINT `originimage_pageOriginId_fkey` FOREIGN KEY (`pageOriginId`) REFERENCES `pageorigin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pageorigin` ADD CONSTRAINT `pageorigin_publicPageId_fkey` FOREIGN KEY (`publicPageId`) REFERENCES `publicpage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `publicpage` RENAME INDEX `PublicPage_slug_key` TO `publicpage_slug_key`;
