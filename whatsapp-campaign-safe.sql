CREATE TYPE "WhatsAppCampaignStatus" AS ENUM (
  'DRAFT',
  'READY',
  'SENDING',
  'COMPLETED',
  'PARTIALLY_COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "WhatsAppCampaignRecipientStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED',
  'BLOCKED'
);

CREATE TABLE "WhatsAppCampaign" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "templateName" TEXT NOT NULL DEFAULT 'artvert_customer_followup',
  "languageCode" TEXT NOT NULL DEFAULT 'ar_EG',
  "status" "WhatsAppCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "totalRecipients" INTEGER NOT NULL DEFAULT 0,
  "pendingCount" INTEGER NOT NULL DEFAULT 0,
  "sentCount" INTEGER NOT NULL DEFAULT 0,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "blockedCount" INTEGER NOT NULL DEFAULT 0,
  "sourceFileName" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WhatsAppCampaign_pkey"
  PRIMARY KEY ("id")
);

CREATE TABLE "WhatsAppCampaignRecipient" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "displayName" TEXT,
  "status" "WhatsAppCampaignRecipientStatus" NOT NULL DEFAULT 'PENDING',
  "blockedReason" TEXT,
  "failureReason" TEXT,
  "metaMessageId" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WhatsAppCampaignRecipient_pkey"
  PRIMARY KEY ("id")
);

CREATE INDEX "WhatsAppCampaign_status_createdAt_idx"
ON "WhatsAppCampaign"("status", "createdAt");

CREATE INDEX "WhatsAppCampaign_createdAt_idx"
ON "WhatsAppCampaign"("createdAt");

CREATE INDEX "WhatsAppCampaignRecipient_campaignId_status_idx"
ON "WhatsAppCampaignRecipient"("campaignId", "status");

CREATE INDEX "WhatsAppCampaignRecipient_phone_idx"
ON "WhatsAppCampaignRecipient"("phone");

CREATE INDEX "WhatsAppCampaignRecipient_status_createdAt_idx"
ON "WhatsAppCampaignRecipient"("status", "createdAt");

CREATE UNIQUE INDEX "WhatsAppCampaignRecipient_campaignId_phone_key"
ON "WhatsAppCampaignRecipient"("campaignId", "phone");

ALTER TABLE "WhatsAppCampaignRecipient"
ADD CONSTRAINT "WhatsAppCampaignRecipient_campaignId_fkey"
FOREIGN KEY ("campaignId")
REFERENCES "WhatsAppCampaign"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;