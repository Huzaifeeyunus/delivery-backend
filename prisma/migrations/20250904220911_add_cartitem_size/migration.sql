-- AlterTable
ALTER TABLE `cartitem` ADD COLUMN `sizeId` INTEGER NULL;

-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `sizeId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `cartitem_sizeId_fkey` ON `cartitem`(`sizeId`);

-- CreateIndex
CREATE INDEX `orderitem_sizeId_fkey` ON `orderitem`(`sizeId`);

-- AddForeignKey
ALTER TABLE `orderitem` ADD CONSTRAINT `orderitem_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `productvariant_size`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cartitem` ADD CONSTRAINT `cartitem_sizeId_fkey` FOREIGN KEY (`sizeId`) REFERENCES `productvariant_size`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
