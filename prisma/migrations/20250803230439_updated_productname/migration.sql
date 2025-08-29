/*
  Warnings:

  - You are about to drop the column `brand` on the `brand` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `color` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `material` table. All the data in the column will be lost.
  - You are about to drop the column `origin` on the `origin` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `size` table. All the data in the column will be lost.
  - You are about to drop the column `tag` on the `tag` table. All the data in the column will be lost.
  - Added the required column `name` to the `Brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Color` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Material` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Origin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Size` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `brand` DROP COLUMN `brand`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `color` DROP COLUMN `color`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `material` DROP COLUMN `material`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `origin` DROP COLUMN `origin`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `size` DROP COLUMN `size`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `tag` DROP COLUMN `tag`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;
