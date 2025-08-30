-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `product_brandId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `product_materialId_fkey`;

-- DropForeignKey
ALTER TABLE `product` DROP FOREIGN KEY `product_originId_fkey`;

-- AlterTable
ALTER TABLE `product` MODIFY `price` DOUBLE NULL,
    MODIFY `longDescription` VARCHAR(191) NULL,
    MODIFY `brandId` INTEGER NULL,
    MODIFY `materialId` INTEGER NULL,
    MODIFY `originId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `material`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_originId_fkey` FOREIGN KEY (`originId`) REFERENCES `origin`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
