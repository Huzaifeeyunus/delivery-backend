/*
  Warnings:

  - Made the column `vendorId` on table `order` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `order` DROP FOREIGN KEY `order_vendorId_fkey`;

-- AlterTable
ALTER TABLE `order` MODIFY `vendorId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
