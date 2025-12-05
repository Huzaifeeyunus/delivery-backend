[dotenv@17.2.1] injecting env (7) from .env -- tip: 📡 auto-backup env with Radar: https://dotenvx.com/radar
-- DropForeignKey
ALTER TABLE `TransactionSplit` DROP FOREIGN KEY `TransactionSplit_transactionId_fkey`;

-- DropForeignKey
ALTER TABLE `TransactionSplit` DROP FOREIGN KEY `TransactionSplit_vendorId_fkey`;

-- AlterTable
ALTER TABLE `transaction` DROP COLUMN `platformFee`;

-- DropTable
DROP TABLE `TransactionSplit`;

-- CreateTable
CREATE TABLE `transactionsplit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionId` INTEGER NOT NULL,
    `vendorId` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `percentage` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TransactionSplit_transactionId_fkey`(`transactionId` ASC),
    INDEX `TransactionSplit_vendorId_fkey`(`vendorId` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `transactionsplit` ADD CONSTRAINT `TransactionSplit_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `transaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactionsplit` ADD CONSTRAINT `TransactionSplit_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

