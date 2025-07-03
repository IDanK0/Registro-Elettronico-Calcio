-- CreateTable
CREATE TABLE `Player` (
    `id` CHAR(36) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `birthDate` DATETIME(3) NOT NULL,
    `licenseNumber` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `phone` VARCHAR(32) NULL,
    `email` VARCHAR(255) NULL,
    `parentName` VARCHAR(191) NULL,
    `parentPhone` VARCHAR(32) NULL,
    `parentEmail` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlayerDocument` (
    `id` CHAR(36) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `data` LONGTEXT NOT NULL,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Training` (
    `id` CHAR(36) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `time` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingAttendance` (
    `id` CHAR(36) NOT NULL,
    `trainingId` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `isPresent` BOOLEAN NOT NULL,

    UNIQUE INDEX `TrainingAttendance_trainingId_playerId_key`(`trainingId`, `playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `id` CHAR(36) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `time` VARCHAR(10) NULL,
    `opponent` VARCHAR(191) NOT NULL,
    `homeAway` ENUM('home', 'away') NOT NULL,
    `status` ENUM('SCHEDULED', 'FIRST_HALF', 'HALF_TIME', 'SECOND_HALF', 'FINISHED') NOT NULL DEFAULT 'SCHEDULED',
    `location` VARCHAR(255) NULL,
    `field` VARCHAR(255) NULL,
    `startTime` INTEGER NULL,
    `firstHalfDuration` INTEGER NOT NULL DEFAULT 0,
    `secondHalfDuration` INTEGER NOT NULL DEFAULT 0,
    `homeScore` INTEGER NOT NULL DEFAULT 0,
    `awayScore` INTEGER NOT NULL DEFAULT 0,
    `lastTimestamp` INTEGER NULL,
    `isRunning` BOOLEAN NOT NULL DEFAULT false,
    `currentPeriodIndex` INTEGER NOT NULL DEFAULT 0,
    `playerJerseyNumbers` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchLineup` (
    `id` CHAR(36) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `jerseyNumber` INTEGER NOT NULL,

    UNIQUE INDEX `MatchLineup_matchId_playerId_key`(`matchId`, `playerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Substitution` (
    `id` CHAR(36) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `minute` INTEGER NOT NULL,
    `second` INTEGER NULL,
    `playerOutId` VARCHAR(191) NOT NULL,
    `playerInId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchEvent` (
    `id` CHAR(36) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `type` ENUM('goal', 'yellow_card', 'red_card', 'second_yellow_card', 'blue_card', 'expulsion', 'warning', 'substitution', 'foul', 'corner', 'offside', 'free_kick', 'penalty', 'throw_in', 'injury') NOT NULL,
    `minute` INTEGER NOT NULL,
    `second` INTEGER NULL,
    `playerId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `teamType` ENUM('own', 'opponent') NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchOpponentLineup` (
    `id` CHAR(36) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `jerseyNumber` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchPeriod` (
    `id` CHAR(36) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `type` ENUM('regular', 'extra', 'interval') NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL,
    `isFinished` BOOLEAN NOT NULL DEFAULT false,
    `periodIndex` INTEGER NOT NULL,

    UNIQUE INDEX `MatchPeriod_matchId_periodIndex_key`(`matchId`, `periodIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Group` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `teamManagement` BOOLEAN NOT NULL DEFAULT false,
    `matchManagement` BOOLEAN NOT NULL DEFAULT false,
    `resultsView` BOOLEAN NOT NULL DEFAULT false,
    `statisticsView` BOOLEAN NOT NULL DEFAULT false,
    `userManagement` BOOLEAN NOT NULL DEFAULT false,
    `groupManagement` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Group_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `expirationDate` DATETIME(3) NOT NULL,
    `groupId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `matricola` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_matricola_key`(`matricola`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchCoach` (
    `id` CHAR(36) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MatchCoach_matchId_userId_key`(`matchId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MatchManager` (
    `id` CHAR(36) NOT NULL,
    `matchId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `MatchManager_matchId_userId_key`(`matchId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PlayerDocument` ADD CONSTRAINT `PlayerDocument_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingAttendance` ADD CONSTRAINT `TrainingAttendance_trainingId_fkey` FOREIGN KEY (`trainingId`) REFERENCES `Training`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrainingAttendance` ADD CONSTRAINT `TrainingAttendance_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchLineup` ADD CONSTRAINT `MatchLineup_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchLineup` ADD CONSTRAINT `MatchLineup_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Substitution` ADD CONSTRAINT `Substitution_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Substitution` ADD CONSTRAINT `Substitution_playerOutId_fkey` FOREIGN KEY (`playerOutId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Substitution` ADD CONSTRAINT `Substitution_playerInId_fkey` FOREIGN KEY (`playerInId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchEvent` ADD CONSTRAINT `MatchEvent_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchEvent` ADD CONSTRAINT `MatchEvent_playerId_fkey` FOREIGN KEY (`playerId`) REFERENCES `Player`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchOpponentLineup` ADD CONSTRAINT `MatchOpponentLineup_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchPeriod` ADD CONSTRAINT `MatchPeriod_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchCoach` ADD CONSTRAINT `MatchCoach_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchCoach` ADD CONSTRAINT `MatchCoach_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchManager` ADD CONSTRAINT `MatchManager_matchId_fkey` FOREIGN KEY (`matchId`) REFERENCES `Match`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MatchManager` ADD CONSTRAINT `MatchManager_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
