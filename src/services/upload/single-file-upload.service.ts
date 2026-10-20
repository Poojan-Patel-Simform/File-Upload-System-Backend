import { type Request, type Response } from "express";
import path from "node:path";
import { createHash } from "node:crypto";
import fs from "fs/promises";
import { TRADITIONAL_UPLOAD_DIR } from "../../constants.js";
import { prisma } from "../../db/prisma.js";

/** Uploads a whole file in one request; dedupes by SHA-256 hash and stores it on disk. */
export const singleFileUploadService = async (req: Request, res: Response) => {
  try {
    const file = req.file as Express.Multer.File | undefined;

    // Check if a file in the request is present and has a buffer
    if (!file || !file.buffer || file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No file received",
        error: "Bad request",
      });
    }

    // Generate a SHA-256 hash of the file buffer to check for duplicates
    const fileHash = createHash("sha256").update(file.buffer).digest("hex");

    // Check if a file with the same hash already exists in the database
    const existing = await prisma.upload.findUnique({ where: { fileHash } });

    // If a file with the same hash exists and is marked as COMPLETED, return its details without re-uploading
    if (existing?.status === "COMPLETED") {
      return res.status(200).json({
        success: true,
        data: {
          uploadId: existing.id,
          fileName: existing.fileName,
          fileSize: Number(existing.fileSize),
          deduplicated: true,
        },
      });
    }

    // If the file is new or not completed, proceed to save it and update the database
    const upload = await prisma.upload.upsert({
      where: { fileHash },
      update: {
        status: "COMPLETED",
        fileName: file.originalname,
        fileSize: BigInt(file.buffer.length),
        totalChunks: 1,
        uploadedChunks: 1,
      },
      create: {
        fileHash,
        fileName: file.originalname,
        fileSize: BigInt(file.buffer.length),
        totalChunks: 1,
        uploadedChunks: 1,
        status: "COMPLETED",
      },
    });

    // Create the upload directory if it doesn't exist and save the file
    const uploadDir = path.join(TRADITIONAL_UPLOAD_DIR, upload.id);
    const filePath = path.join(uploadDir, upload.fileName);

    // Ensure the directory exists and write the file to disk
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    return res.status(200).json({
      success: true,
      data: {
        uploadId: upload.id,
        fileName: upload.fileName,
        filePath,
        fileSize: file.buffer.length,
      },
    });
  } catch (error) {
    console.error("uploadSingle error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
