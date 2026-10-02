-- CreateTable
CREATE TABLE "AiInteraction" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptHash" TEXT,
    "structuredOutput" JSONB,
    "validationPassed" BOOLEAN NOT NULL DEFAULT true,
    "latencyMs" INTEGER NOT NULL,
    "tokensUsed" INTEGER,
    "isSuccess" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiRequestInterpretation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rawTextHash" TEXT NOT NULL,
    "extractedIntent" JSONB NOT NULL,
    "categorySlug" TEXT,
    "serviceSlug" TEXT,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmedBookingId" TEXT,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiRequestInterpretation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiReviewSummary" (
    "id" TEXT NOT NULL,
    "providerProfileId" TEXT NOT NULL,
    "summaryText" TEXT NOT NULL,
    "positiveThemes" TEXT[],
    "areasForImprovement" TEXT[],
    "reviewCountAnalyzed" INTEGER NOT NULL,
    "averageRatingSnapshot" DOUBLE PRECISION NOT NULL,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiReviewSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiOperationalSignal" (
    "id" TEXT NOT NULL,
    "signalType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiOperationalSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiInteraction_userId_idx" ON "AiInteraction"("userId");

-- CreateIndex
CREATE INDEX "AiInteraction_feature_idx" ON "AiInteraction"("feature");

-- CreateIndex
CREATE INDEX "AiInteraction_createdAt_idx" ON "AiInteraction"("createdAt");

-- CreateIndex
CREATE INDEX "AiInteraction_isSuccess_idx" ON "AiInteraction"("isSuccess");

-- CreateIndex
CREATE INDEX "AiRequestInterpretation_userId_idx" ON "AiRequestInterpretation"("userId");

-- CreateIndex
CREATE INDEX "AiRequestInterpretation_categorySlug_idx" ON "AiRequestInterpretation"("categorySlug");

-- CreateIndex
CREATE INDEX "AiRequestInterpretation_serviceSlug_idx" ON "AiRequestInterpretation"("serviceSlug");

-- CreateIndex
CREATE INDEX "AiRequestInterpretation_createdAt_idx" ON "AiRequestInterpretation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiReviewSummary_providerProfileId_key" ON "AiReviewSummary"("providerProfileId");

-- CreateIndex
CREATE INDEX "AiReviewSummary_providerProfileId_idx" ON "AiReviewSummary"("providerProfileId");

-- CreateIndex
CREATE INDEX "AiReviewSummary_generatedAt_idx" ON "AiReviewSummary"("generatedAt");

-- CreateIndex
CREATE INDEX "AiOperationalSignal_signalType_idx" ON "AiOperationalSignal"("signalType");

-- CreateIndex
CREATE INDEX "AiOperationalSignal_entityType_entityId_idx" ON "AiOperationalSignal"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AiOperationalSignal_status_idx" ON "AiOperationalSignal"("status");

-- CreateIndex
CREATE INDEX "AiOperationalSignal_createdAt_idx" ON "AiOperationalSignal"("createdAt");

-- AddForeignKey
ALTER TABLE "AiInteraction" ADD CONSTRAINT "AiInteraction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiRequestInterpretation" ADD CONSTRAINT "AiRequestInterpretation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiReviewSummary" ADD CONSTRAINT "AiReviewSummary_providerProfileId_fkey" FOREIGN KEY ("providerProfileId") REFERENCES "ServiceProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
