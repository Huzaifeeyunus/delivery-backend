/*
  Warnings:

  - You are about to alter the column `paymentMethod` on the `order` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(3))`.
  - You are about to alter the column `paymentStatus` on the `order` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.
  - You are about to alter the column `deliveryStatus` on the `order` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.
  - You are about to drop the column `price` on the `orderitem` table. All the data in the column will be lost.
  - Added the required column `subtotal` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `platformFee` on table `order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `vendorEarning` on table `order` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `subtotal` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `shippingFee` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `subtotal` DOUBLE NOT NULL,
    MODIFY `paymentMethod` ENUM('cash', 'momo', 'card') NULL,
    MODIFY `paymentStatus` ENUM('pending', 'unpaid', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'unpaid',
    MODIFY `platformFee` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `vendorEarning` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `deliveryStatus` ENUM('pending', 'enroute', 'delivered') NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `orderitem` DROP COLUMN `price`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `subtotal` DOUBLE NOT NULL,
    ADD COLUMN `unitPrice` DOUBLE NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;
