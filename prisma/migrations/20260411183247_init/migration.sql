-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'CNG', 'HYDROGEN', 'OTHER');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'DCT', 'OTHER');

-- CreateEnum
CREATE TYPE "DrivetrainType" AS ENUM ('FWD', 'RWD', 'AWD', 'FOUR_WD');

-- CreateEnum
CREATE TYPE "MileageUnit" AS ENUM ('KM', 'MI');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('REGISTRATION', 'INSURANCE', 'INSPECTION', 'INVOICE', 'SERVICE_BOOK', 'OWNERSHIP', 'WARRANTY', 'PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "VisibilityLevel" AS ENUM ('PRIVATE', 'SHARED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('OIL_CHANGE', 'FILTER_AIR', 'FILTER_CABIN', 'FILTER_FUEL', 'FILTER_OIL', 'BRAKE_FLUID', 'COOLANT', 'SPARK_PLUGS', 'TIMING_BELT', 'TIMING_CHAIN', 'TRANSMISSION_OIL', 'TIRES', 'BATTERY', 'BRAKES', 'SUSPENSION', 'REGISTRATION', 'INSURANCE', 'INSPECTION', 'SEASONAL_SERVICE', 'GENERAL_SERVICE', 'REPAIR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReminderSource" AS ENUM ('OFFICIAL_PLAN', 'USER_CUSTOM', 'TRANSFER_IMPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('UPCOMING', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'SNOOZED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PlanVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "IntervalRuleType" AS ENUM ('TIME_ONLY', 'MILEAGE_ONLY', 'WHICHEVER_FIRST', 'INSPECT_ONLY', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "WarningLevel" AS ENUM ('INFO', 'NORMAL', 'IMPORTANT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AssignmentConfidence" AS ENUM ('EXACT', 'LIKELY', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'IN_APP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "passwordHash" TEXT,
    "name" TEXT,
    "avatarUrl" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "notificationPrefs" JSONB NOT NULL DEFAULT '{"email":true,"inApp":true,"leadDays":[30,14,7]}',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "generation" TEXT,
    "year" INTEGER NOT NULL,
    "vin" TEXT,
    "plate" TEXT,
    "engine" TEXT,
    "engineCode" TEXT,
    "fuelType" "FuelType" NOT NULL DEFAULT 'PETROL',
    "transmission" "TransmissionType" NOT NULL DEFAULT 'MANUAL',
    "drivetrain" "DrivetrainType" NOT NULL DEFAULT 'FWD',
    "bodyType" TEXT,
    "color" TEXT,
    "marketRegion" TEXT,
    "currentMileage" INTEGER NOT NULL DEFAULT 0,
    "mileageUnit" "MileageUnit" NOT NULL DEFAULT 'KM',
    "purchaseDate" TIMESTAMP(3),
    "purchaseMileage" INTEGER,
    "nickname" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "imageKey" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDocument" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "documentDate" TIMESTAMP(3),
    "visibilitySetting" "VisibilityLevel" NOT NULL DEFAULT 'PRIVATE',
    "includeInShareDefault" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT NOT NULL DEFAULT 'user_upload',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "mileageAtService" INTEGER,
    "category" "MaintenanceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "partsUsed" TEXT,
    "laborNotes" TEXT,
    "costAmount" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'EUR',
    "workshopName" TEXT,
    "isOfficialPlanDerived" BOOLEAN NOT NULL DEFAULT false,
    "linkedPlanItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "sourceType" "ReminderSource" NOT NULL DEFAULT 'USER_CUSTOM',
    "category" "MaintenanceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueMileage" INTEGER,
    "recurrenceRule" JSONB,
    "leadTimeDays" INTEGER NOT NULL DEFAULT 30,
    "status" "ReminderStatus" NOT NULL DEFAULT 'UPCOMING',
    "lastTriggeredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "linkedPlanItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePlan" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "generation" TEXT,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "engine" TEXT,
    "engineCode" TEXT,
    "fuelType" "FuelType",
    "transmission" "TransmissionType",
    "marketRegion" TEXT,
    "sourceDocumentId" TEXT,
    "verificationStatus" "PlanVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "sourceLabel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePlanItem" (
    "id" TEXT NOT NULL,
    "maintenancePlanId" TEXT NOT NULL,
    "category" "MaintenanceCategory" NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "mileageInterval" INTEGER,
    "timeIntervalMonths" INTEGER,
    "ruleType" "IntervalRuleType" NOT NULL DEFAULT 'WHICHEVER_FIRST',
    "warningLevel" "WarningLevel" NOT NULL DEFAULT 'NORMAL',
    "sourceReference" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenancePlanSourceDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "yearRange" TEXT,
    "marketRegion" TEXT,
    "fileUrl" TEXT,
    "fileKey" TEXT,
    "sourceType" TEXT NOT NULL,
    "verificationStatus" "PlanVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "extractionNotes" TEXT,
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePlanSourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePlanAssignment" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "maintenancePlanId" TEXT NOT NULL,
    "assignedByUserId" TEXT NOT NULL,
    "assignmentConfidence" "AssignmentConfidence" NOT NULL DEFAULT 'EXACT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiclePlanAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "pinHash" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "visibilityConfig" JSONB NOT NULL DEFAULT '{"showMaintenance":true,"showDocuments":false,"showCosts":false,"showVin":false,"showPlate":true,"showNotes":false}',
    "label" TEXT,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnershipTransfer" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "toUserId" TEXT,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "includeDocuments" BOOLEAN NOT NULL DEFAULT true,
    "includeCosts" BOOLEAN NOT NULL DEFAULT false,
    "includePrivateNotes" BOOLEAN NOT NULL DEFAULT false,
    "includeServiceHistory" BOOLEAN NOT NULL DEFAULT true,
    "preserveSellerArchive" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,
    "token" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnershipTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "reminderId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "subject" TEXT,
    "payloadSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actionType" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RecordDocuments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RecordDocuments_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "ShareLink"("token");

-- CreateIndex
CREATE UNIQUE INDEX "OwnershipTransfer_token_key" ON "OwnershipTransfer"("token");

-- CreateIndex
CREATE INDEX "_RecordDocuments_B_index" ON "_RecordDocuments"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDocument" ADD CONSTRAINT "VehicleDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_linkedPlanItemId_fkey" FOREIGN KEY ("linkedPlanItemId") REFERENCES "MaintenancePlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_linkedPlanItemId_fkey" FOREIGN KEY ("linkedPlanItemId") REFERENCES "MaintenancePlanItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "MaintenancePlanSourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlanItem" ADD CONSTRAINT "MaintenancePlanItem_maintenancePlanId_fkey" FOREIGN KEY ("maintenancePlanId") REFERENCES "MaintenancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenancePlanSourceDocument" ADD CONSTRAINT "MaintenancePlanSourceDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePlanAssignment" ADD CONSTRAINT "VehiclePlanAssignment_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePlanAssignment" ADD CONSTRAINT "VehiclePlanAssignment_maintenancePlanId_fkey" FOREIGN KEY ("maintenancePlanId") REFERENCES "MaintenancePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePlanAssignment" ADD CONSTRAINT "VehiclePlanAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordDocuments" ADD CONSTRAINT "_RecordDocuments_A_fkey" FOREIGN KEY ("A") REFERENCES "MaintenanceRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecordDocuments" ADD CONSTRAINT "_RecordDocuments_B_fkey" FOREIGN KEY ("B") REFERENCES "VehicleDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
