-- CreateTable
CREATE TABLE "ChunkItem" (
    "id" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "english" TEXT NOT NULL,
    "korean" TEXT NOT NULL,
    "example" TEXT NOT NULL,
    "datasetVersion" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ChunkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChunkDrillProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chunkItemId" INTEGER NOT NULL,
    "practiceCount" INTEGER NOT NULL DEFAULT 0,
    "lastPracticedAt" TIMESTAMP(3),

    CONSTRAINT "ChunkDrillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChunkItem_rank_key" ON "ChunkItem"("rank");

-- CreateIndex
CREATE INDEX "ChunkDrillProgress_userId_practiceCount_idx" ON "ChunkDrillProgress"("userId", "practiceCount");

-- CreateIndex
CREATE UNIQUE INDEX "ChunkDrillProgress_userId_chunkItemId_key" ON "ChunkDrillProgress"("userId", "chunkItemId");

-- AddForeignKey
ALTER TABLE "ChunkDrillProgress" ADD CONSTRAINT "ChunkDrillProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChunkDrillProgress" ADD CONSTRAINT "ChunkDrillProgress_chunkItemId_fkey" FOREIGN KEY ("chunkItemId") REFERENCES "ChunkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
