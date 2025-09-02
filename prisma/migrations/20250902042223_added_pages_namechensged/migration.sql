/*
  Warnings:

  - You are about to drop the `originimage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pageorigin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `originimage` DROP FOREIGN KEY `OriginImage_pageOriginId_fkey`;

-- DropForeignKey
ALTER TABLE `pageorigin` DROP FOREIGN KEY `PageOrigin_publicPageId_fkey`;

-- DropTable
DROP TABLE `originimage`;

-- DropTable
DROP TABLE `pageorigin`;

-- CreateTable
CREATE TABLE `PublicPageOrigin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `publicPageId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PublicOriginImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imageUrl` VARCHAR(191) NOT NULL,
    `pageOriginId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PublicPageOrigin` ADD CONSTRAINT `PublicPageOrigin_publicPageId_fkey` FOREIGN KEY (`publicPageId`) REFERENCES `PublicPage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PublicOriginImage` ADD CONSTRAINT `PublicOriginImage_pageOriginId_fkey` FOREIGN KEY (`pageOriginId`) REFERENCES `PublicPageOrigin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
