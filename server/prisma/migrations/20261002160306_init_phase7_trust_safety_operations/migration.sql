-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_INFORMATION');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'WAITING_FOR_INFO', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "DisputePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TrustSafetyStatus" AS ENUM ('FLAGGED', 'UNDER_REVIEW', 'CLEARED', 'RESTRICTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "TrustSafetySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReportStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "ReportStatus" ADD VALUE 'ESCALATED';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "assignedAdminId" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'MEDIUM',
ADD COLUMN     "resolutionNotes" TEXT;

-- AlterTable
ALTER TABLE "ServiceProviderProfile" ADD COLUMN     "isRestricted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "restrictionReason" TEXT;

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" TEXT NOT NULL,
    "providerProfileId" TEXT NOT NULL,
    "verificationType" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "documents" JSONB,
    "reviewerNotes" TEXT,
    "rejectionReason" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "bookingId" TEXT,
    "openedByUserId" TEXT NOT NULL,
    "respondentUserId" TEXT,
    "category" TEXT NOT NULL,
    "priority" "DisputePriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "issueSummary" TEXT NOT NULL,
    "detailedDescription" TEXT NOT NULL,
    "amountInvolvedPaise" INTEGER,
    "assignedAdminId" TEXT,
    "internalNotes" TEXT,
    "resolutionSummary" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "requesterUserId" TEXT,
    "requesterRole" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "category" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedAdminId" TEXT,
    "bookingId" TEXT,
    "internalNotes" TEXT,
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustSafetyCase" (
    "id" TEXT NOT NULL,
    "caseReference" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "riskSignal" TEXT NOT NULL,
    "severity" "TrustSafetySeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "TrustSafetyStatus" NOT NULL DEFAULT 'FLAGGED',
    "assignedAdminId" TEXT,
    "investigationNotes" TEXT,
    "resolutionSummary" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustSafetyCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "category" TEXT DEFAULT 'GENERAL',
    "updatedByAdminId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "VerificationRecord_providerProfileId_idx" ON "VerificationRecord"("providerProfileId");

-- CreateIndex
CREATE INDEX "VerificationRecord_status_idx" ON "VerificationRecord"("status");

-- CreateIndex
CREATE INDEX "VerificationRecord_verificationType_idx" ON "VerificationRecord"("verificationType");

-- CreateIndex
CREATE INDEX "VerificationRecord_reviewedByAdminId_idx" ON "VerificationRecord"("reviewedByAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_caseNumber_key" ON "Dispute"("caseNumber");

-- CreateIndex
CREATE INDEX "Dispute_bookingId_idx" ON "Dispute"("bookingId");

-- CreateIndex
CREATE INDEX "Dispute_openedByUserId_idx" ON "Dispute"("openedByUserId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "Dispute_priority_idx" ON "Dispute"("priority");

-- CreateIndex
CREATE INDEX "Dispute_caseNumber_idx" ON "Dispute"("caseNumber");

-- CreateIndex
CREATE INDEX "Dispute_assignedAdminId_idx" ON "Dispute"("assignedAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_requesterUserId_idx" ON "SupportTicket"("requesterUserId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");

-- CreateIndex
CREATE INDEX "SupportTicket_ticketNumber_idx" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedAdminId_idx" ON "SupportTicket"("assignedAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustSafetyCase_caseReference_key" ON "TrustSafetyCase"("caseReference");

-- CreateIndex
CREATE INDEX "TrustSafetyCase_entityType_entityId_idx" ON "TrustSafetyCase"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "TrustSafetyCase_status_idx" ON "TrustSafetyCase"("status");

-- CreateIndex
CREATE INDEX "TrustSafetyCase_severity_idx" ON "TrustSafetyCase"("severity");

-- CreateIndex
CREATE INDEX "TrustSafetyCase_caseReference_idx" ON "TrustSafetyCase"("caseReference");

-- CreateIndex
CREATE INDEX "TrustSafetyCase_assignedAdminId_idx" ON "TrustSafetyCase"("assignedAdminId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformSetting_category_idx" ON "PlatformSetting"("category");

-- CreateIndex
CREATE INDEX "Report_assignedAdminId_idx" ON "Report"("assignedAdminId");

-- CreateIndex
CREATE INDEX "ServiceProviderProfile_isRestricted_idx" ON "ServiceProviderProfile"("isRestricted");

-- CreateIndex
CREATE INDEX "ServiceProviderProfile_isVerified_idx" ON "ServiceProviderProfile"("isVerified");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "ServiceProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_respondentUserId_fkey" FOREIGN KEY ("respondentUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustSafetyCase" ADD CONSTRAINT "TrustSafetyCase_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
