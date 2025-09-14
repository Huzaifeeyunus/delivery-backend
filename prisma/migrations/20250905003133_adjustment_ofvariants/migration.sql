/*
  Warnings:

  - You are about to alter the column `stockStatus` on the `product` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - You are about to drop the column `color` on the `productvariant` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `productvariant_size` table. All the data in the column will be lost.
  - You are about to alter the column `stockStatus` on the `productvariant_size` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.
  - A unique constraint covering the columns `[name]` on the table `color` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `colorId` to the `productvariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sizeId` to the `productvariant_size` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `color` ADD COLUMN `hex` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `product` MODIFY `stockStatus` ENUM('IN_STOCK', 'OUT_OF_STOCK', 'PREORDER') NOT NULL DEFAULT 'IN_STOCK';

-- AlterTable
ALTER TABLE `productimage` ADD COLUMN `productId` INTEGER NULL;

-- AlterTable
ALTER TABLE `productvariant` DROP COLUMN `color`,
    ADD COLUMN `colorId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `productvariant_size` DROP COLUMN `size`,
    ADD COLUMN `sizeId` INTEGER NOT NULL,
    MODIFY `stockStatus` ENUM('IN_STOCK', 'OUT_OF_STOCK', 'PREORDER') NOT NULL DEFAULT 'IN_STOCK';

-- CreateIndex
CREATE UNIQUE INDEX `color_name_key` ON `color`(`name`);

-- CreateIndex
CREATE INDEX `productimage_productId_fkey` ON `productimage`(`productId`);

-- AddForeignKey
ALTER TABLE `productvariant` ADD CONSTRAINT `productvariant_colorId_fkey` FOREIGN KEY (`colorId`) REFERENCES `color`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productvariant_size` ADD CONSTRAINT `productvariant_size_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `size`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productimage` ADD CONSTRAINT `productimage_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
