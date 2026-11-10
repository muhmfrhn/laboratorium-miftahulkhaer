-- CreateTable
CREATE TABLE `booking_inventori` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `keperluan` VARCHAR(191) NOT NULL,
    `catatan` VARCHAR(191) NULL,
    `tglmulai` DATETIME(3) NOT NULL,
    `tglselesai` DATETIME(3) NOT NULL,
    `status` ENUM('DIBOOKING', 'SELESAI', 'BATAL') NOT NULL DEFAULT 'DIBOOKING',
    `bookedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `inventoryId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    INDEX `booking_inventori_inventoryId_status_tglmulai_tglselesai_idx`(`inventoryId`, `status`, `tglmulai`, `tglselesai`),
    INDEX `booking_inventori_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `booking_inventori` ADD CONSTRAINT `booking_inventori_inventoryId_fkey` FOREIGN KEY (`inventoryId`) REFERENCES `Inventory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `booking_inventori` ADD CONSTRAINT `booking_inventori_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
