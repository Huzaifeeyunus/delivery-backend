-- AlterTable
ALTER TABLE `publicpage` ADD COLUMN `isVisible` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `showInFooter` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `showInHeader` BOOLEAN NOT NULL DEFAULT false;
