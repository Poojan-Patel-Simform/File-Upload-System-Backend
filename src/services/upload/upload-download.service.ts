import { type Request, type Response } from "express";
import path from "node:path";
import fs from "fs/promises";
import { prisma } from "../../db/prisma.js";
import { MERGED_DIR, TRADITIONAL_UPLOAD_DIR } from "../../constants.js";

/** Sends a completed upload's file to the client as a download. */
export const uploadDownloadService = async (req: Request, res: Response) => {
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

    if (upload.status !== "COMPLETED") {
      return res.status(409).json({
        success: false,
        message: "Upload is not completed yet",
        error: "Conflict",
      });
    }

    // Single-file and merged uploads live in different folders
    const baseDir =
      upload.totalChunks === 1 ? TRADITIONAL_UPLOAD_DIR : MERGED_DIR;
    const filePath = path.join(baseDir, upload.id, upload.fileName);

    try {
      // Guard against a COMPLETED row whose file is missing on disk
      await fs.access(filePath);
    } catch {
      console.error(
        `uploadDownload: upload ${upload.id} is COMPLETED but file is missing at ${filePath}`,
      );
      return res.status(404).json({
        success: false,
        message: "Completed upload record exists but the file is missing on disk",
        error: "Not found",
      });
    }

    return res.download(filePath, upload.fileName, (err) => {
      if (err) {
        console.error("uploadDownload stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Failed to send file",
            error: err.message,
          });
        }
      }
    });
  } catch (error) {
    console.error("uploadDownload error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
