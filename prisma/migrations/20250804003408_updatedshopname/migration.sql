/*
  Warnings:

  - Added the required column `shopLocation` to the `Vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopPhone` to the `Vendor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `vendor` ADD COLUMN `shopEmail` VARCHAR(191) NULL,
    ADD COLUMN `shopLatitude` DOUBLE NULL,
    ADD COLUMN `shopLocation` VARCHAR(191) NOT NULL,
    ADD COLUMN `shopLongitude` DOUBLE NULL,
    ADD COLUMN `shopOwner` VARCHAR(191) NULL,
    ADD COLUMN `shopPhone` VARCHAR(191) NOT NULL,
    ADD COLUMN `shopWebsite` VARCHAR(191) NULL,
    MODIFY `shopAddress` VARCHAR(191) NULL;
