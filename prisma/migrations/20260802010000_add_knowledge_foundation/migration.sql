-- CreateEnum
CREATE TYPE "KnowledgeEntityType" AS ENUM ('PLANT', 'DISEASE', 'PEST', 'DEFICIENCY', 'PRODUCT');
CREATE TYPE "KnowledgePublicationState" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "KnowledgeReleaseStatus" AS ENUM ('GENERATING', 'ACTIVE', 'FAILED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "KnowledgeEntity" (
    "id" TEXT NOT NULL,
    "type" "KnowledgeEntityType" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "publicationState" "KnowledgePublicationState" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KnowledgeEntity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeRelease" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "status" "KnowledgeReleaseStatus" NOT NULL DEFAULT 'GENERATING',
    "contentChecksum" TEXT,
    "manifestChecksum" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    CONSTRAINT "KnowledgeRelease_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeGenerationLock" (
    "id" TEXT NOT NULL,
    "ownerToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "latestGeneration" INTEGER NOT NULL DEFAULT 0,
    "activeReleaseId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "KnowledgeGenerationLock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KnowledgeEntity_type_slug_key" ON "KnowledgeEntity"("type", "slug");
CREATE INDEX "KnowledgeEntity_publicationState_type_idx" ON "KnowledgeEntity"("publicationState", "type");
CREATE UNIQUE INDEX "KnowledgeRelease_version_key" ON "KnowledgeRelease"("version");
CREATE UNIQUE INDEX "KnowledgeRelease_generation_key" ON "KnowledgeRelease"("generation");
CREATE UNIQUE INDEX "KnowledgeRelease_manifestChecksum_key" ON "KnowledgeRelease"("manifestChecksum");
CREATE INDEX "KnowledgeRelease_status_idx" ON "KnowledgeRelease"("status");
CREATE INDEX "KnowledgeRelease_contentChecksum_idx" ON "KnowledgeRelease"("contentChecksum");
CREATE UNIQUE INDEX "KnowledgeGenerationLock_activeReleaseId_key" ON "KnowledgeGenerationLock"("activeReleaseId");
CREATE UNIQUE INDEX "KnowledgeRelease_one_active" ON "KnowledgeRelease"("status") WHERE "status" = 'ACTIVE';

ALTER TABLE "KnowledgeGenerationLock" ADD CONSTRAINT "KnowledgeGenerationLock_activeReleaseId_fkey"
FOREIGN KEY ("activeReleaseId") REFERENCES "KnowledgeRelease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "KnowledgeGenerationLock" ("id", "latestGeneration", "updatedAt")
VALUES ('knowledge-generator', 0, CURRENT_TIMESTAMP);
