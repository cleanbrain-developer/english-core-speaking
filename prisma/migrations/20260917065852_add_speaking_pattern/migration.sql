-- CreateTable
CREATE TABLE "SpeakingPattern" (
    "id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "speakingIntent" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "familyLabel" TEXT NOT NULL,
    "parentPatternId" TEXT,
    "pattern" TEXT NOT NULL,
    "koreanMeaning" TEXT NOT NULL,
    "speakingFunction" TEXT NOT NULL,
    "description" TEXT,
    "slots" JSONB NOT NULL,
    "examples" JSONB NOT NULL,
    "expansions" JSONB,
    "relatedPatternIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contrastPatternIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "datasetVersion" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SpeakingPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingPatternProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "practiceCount" INTEGER NOT NULL DEFAULT 0,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "lastPracticedAt" TIMESTAMP(3),

    CONSTRAINT "SpeakingPatternProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingPattern_rank_key" ON "SpeakingPattern"("rank");

-- CreateIndex
CREATE INDEX "SpeakingPattern_speakingIntent_isActive_idx" ON "SpeakingPattern"("speakingIntent", "isActive");

-- CreateIndex
CREATE INDEX "SpeakingPattern_familyId_idx" ON "SpeakingPattern"("familyId");

-- CreateIndex
CREATE INDEX "SpeakingPatternProgress_userId_practiceCount_idx" ON "SpeakingPatternProgress"("userId", "practiceCount");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingPatternProgress_userId_patternId_key" ON "SpeakingPatternProgress"("userId", "patternId");

-- AddForeignKey
ALTER TABLE "SpeakingPatternProgress" ADD CONSTRAINT "SpeakingPatternProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingPatternProgress" ADD CONSTRAINT "SpeakingPatternProgress_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "SpeakingPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
