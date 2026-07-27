/*
  Warnings:

  - You are about to drop the `upload_chunks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "upload_chunks" DROP CONSTRAINT "upload_chunks_uploadId_fkey";

-- DropTable
DROP TABLE "upload_chunks";

-- CreateTable
CREATE TABLE "cloudinary_assets" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cloudinary_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cloudinary_assets_publicId_key" ON "cloudinary_assets"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "cloudinary_assets_fileHash_key" ON "cloudinary_assets"("fileHash");
