-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "ServiceProviderProfile" ADD COLUMN     "vacationMode" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProviderAvailability" (
    "id" TEXT NOT NULL,
    "providerProfileId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAvailabilityOverride" (
    "id" TEXT NOT NULL,
    "providerProfileId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderAvailability_providerProfileId_idx" ON "ProviderAvailability"("providerProfileId");

-- CreateIndex
CREATE INDEX "ProviderAvailability_dayOfWeek_idx" ON "ProviderAvailability"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAvailability_providerProfileId_dayOfWeek_key" ON "ProviderAvailability"("providerProfileId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "ProviderAvailabilityOverride_providerProfileId_idx" ON "ProviderAvailabilityOverride"("providerProfileId");

-- CreateIndex
CREATE INDEX "ProviderAvailabilityOverride_providerProfileId_date_idx" ON "ProviderAvailabilityOverride"("providerProfileId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAvailabilityOverride_providerProfileId_date_key" ON "ProviderAvailabilityOverride"("providerProfileId", "date");

-- AddForeignKey
ALTER TABLE "ProviderAvailability" ADD CONSTRAINT "ProviderAvailability_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "ServiceProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAvailabilityOverride" ADD CONSTRAINT "ProviderAvailabilityOverride_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "ServiceProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
