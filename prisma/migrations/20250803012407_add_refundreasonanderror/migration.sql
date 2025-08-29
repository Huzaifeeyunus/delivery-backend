-- AlterTable
ALTER TABLE `order` ADD COLUMN `paymentError` VARCHAR(191) NULL,
    ADD COLUMN `refundReason` VARCHAR(191) NULL,
    MODIFY `status` ENUM('pending', 'accepted', 'preparing', 'picked', 'delivered', 'cancelled', 'failed', 'refunded') NOT NULL DEFAULT 'pending';
