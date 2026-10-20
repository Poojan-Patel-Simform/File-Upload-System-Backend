import { type Request, type Response } from "express";
import path from "node:path";
import fs from "fs/promises";
import { prisma } from "../../db/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { CHUNK_DIR, MERGED_DIR, TRADITIONAL_UPLOAD_DIR } from "../../constants.js";
import * as chunkStore from "../chunk/chunk-store.js";

/**
 * Permanently deletes an upload: chunk + final files, Redis records, then the DB row.
 * The DB row is only removed after file cleanup succeeds.
 */
export const uploadPermanentDeleteService = async (
  req: Request,
  res: Response,
) => {
  try {
    const { uploadId } = req.params;

    if (typeof uploadId !== "string") {
      return res.status(400).json({
        success: false,
        message: "uploadId must be a single path segment",
        error: "Bad request",
      });
    }

    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });

    if (!upload) {
      return res.status(404).json({
        success: false,
        message: "Upload not found",
        error: "Not found",
      });
    }

    // Single-file and merged uploads live in different folders
    const completedDir =
      upload.totalChunks === 1 ? TRADITIONAL_UPLOAD_DIR : MERGED_DIR;

    try {
      await fs.rm(path.join(CHUNK_DIR, upload.id), {
        recursive: true,
        force: true,
      });
      await fs.rm(path.join(completedDir, upload.id), {
        recursive: true,
        force: true,
      });
      await chunkStore.deleteAllChunks(upload.id);
    } catch (cleanupError) {
      console.error("uploadPermanentDelete cleanup error:", cleanupError);
      return res.status(500).json({
        success: false,
        message: "Failed to clean up upload files, database row was not deleted",
        error:
          cleanupError instanceof Error
            ? cleanupError.message
            : "Unknown error",
      });
    }

    try {
      // P2025 = row already gone (concurrent delete): ignore it, rethrow anything else
      await prisma.upload.delete({ where: { id: upload.id } });
    } catch (dbError) {
      if (
        !(
          dbError instanceof Prisma.PrismaClientKnownRequestError &&
          dbError.code === "P2025"
        )
      ) {
        throw dbError;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        uploadId: upload.id,
        message: "Upload permanently deleted",
      },
    });
  } catch (error) {
    console.error("uploadPermanentDelete error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
