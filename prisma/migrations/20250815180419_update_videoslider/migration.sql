/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `videoslider` table. All the data in the column will be lost.
  - Added the required column `videoUrl` to the `VideoSlider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `videoslider` DROP COLUMN `imageUrl`,
    ADD COLUMN `videoUrl` VARCHAR(191) NOT NULL;
