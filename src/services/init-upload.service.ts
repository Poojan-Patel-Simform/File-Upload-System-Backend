import { type Request, type Response } from "express";
import { prisma } from "../db/prisma.js";
import path from "node:path";
import { CHUNK_DIR } from "../constants.js";
import { createHash } from "node:crypto";
import fs from "fs/promises";
import { type InitUploadBody } from "../schemas/upload.schema.js";
import * as chunkStore from "./chunk-store.js";

export const initUploadService = async (req: Request, res: Response) => {
  try {
    const {
      fileHash,
      fileName,
      fileSize: parsedFileSize,
      totalChunks,
    } = req.body as InitUploadBody;

    // Check if an upload with the same fileHash already exists
    const existingUpload = await prisma.upload.findFirst({
      where: { fileHash },
    });

    // If no existing upload is found, create a new upload entry
    if (!existingUpload) {
      const upload = await prisma.upload.create({
        data: {
          fileHash,
          fileName,
          fileSize: parsedFileSize,
          totalChunks,
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          status: upload.status,
          uploadId: upload.id,
          uploadedChunks: [],
        },
      });
    }

    // If an existing upload completed, return its status and indicate that it's deduplicated
    if (existingUpload.status === "COMPLETED") {
      return res.status(200).json({
        success: true,
        data: {
          status: existingUpload.status,
          uploadId: existingUpload.id,
          deduplicated: true,
        },
      });
    }

    // If an existing upload is in progress, return its status and the indices of already uploaded chunks
    if (existingUpload.status === "UPLOADING") {
      // Fetch the chunks from redis
      const uploadedIndices = await chunkStore.getAllChunkIndices(
        existingUpload.id,
      );

      return res.status(200).json({
        success: true,
        data: {
          status: existingUpload.status,
          uploadId: existingUpload.id,
          uploadedChunks: uploadedIndices,
        },
      });
    }

    // If an existing upload is being finalized, return a conflict response
    if (existingUpload.status === "MERGING") {
      return res.status(409).json({
        success: false,
        message: "Upload is currently being finalized, please retry shortly",
        error: "Conflict",
      });
    }

    // If an existing upload failed, check for surviving chunks and return their indices
    if (existingUpload.status === "FAILED") {
      const uploadDir = path.join(CHUNK_DIR, existingUpload.id);

      // If the client is retrying with a different chunk count/size, old chunk
      // indices no longer line up with the new layout, so recovery is skipped
      // and the upload is restarted from scratch below.
      const chunkingMatches = existingUpload.totalChunks === totalChunks;

      let survivingIndices: number[] | null = null;
      let staleIndices: number[] = [];

      if (chunkingMatches) {
        try {
          // Throws if the chunk directory itself was removed (e.g. by a prior
          // cleanup job), which is treated as "nothing survived, start over".
          await fs.access(uploadDir);

          // Fetch all existing chunks from the redis store
          const existingChunks = await chunkStore.getAllChunks(
            existingUpload.id,
          );

          const surviving: number[] = [];
          const stale: number[] = [];

          // Redis metadata alone isn't trustworthy after a crash: the on-disk
          // chunk write may have been interrupted, so each chunk is re-verified
          // against the filesystem before it's allowed to count as "uploaded".
          for (const chunk of existingChunks) {
            const chunkPath = path.join(uploadDir, String(chunk.chunkIndex));
            try {
              const stat = await fs.stat(chunkPath);
              if (stat.size === 0) {
                // A truncated/empty write (interrupted mid-flush) - discard.
                stale.push(chunk.chunkIndex);
                continue;
              }

              if (chunk.checksum) {
                // Detect silent corruption: bytes on disk don't match what
                // the client claimed to have sent for this chunk.
                const buffer = await fs.readFile(chunkPath);
                const actualChecksum = createHash("sha256")
                  .update(buffer)
                  .digest("hex");
                if (actualChecksum !== chunk.checksum) {
                  stale.push(chunk.chunkIndex);
                  continue;
                }
              }

              surviving.push(chunk.chunkIndex);
            } catch {
              // File missing/unreadable despite Redis metadata existing.
              stale.push(chunk.chunkIndex);
            }
          }

          survivingIndices = surviving;
          staleIndices = stale;
        } catch {
          // Chunk directory is gone or shapes didn't match - can't resume.
          survivingIndices = null;
        }
      }

      // Purge Redis records for chunks that failed verification so a later
      // resume attempt doesn't see them as "already uploaded" again.
      if (staleIndices.length > 0) {
        await chunkStore.deleteChunkFields(existingUpload.id, staleIndices);
      }

      // survivingIndices !== null means recovery was attempted (even if the
      // result is an empty array) - resume the same upload record rather than
      // wiping it, so the client can continue with only the missing chunks.
      if (survivingIndices !== null) {
        const resumed = await prisma.upload.update({
          where: { id: existingUpload.id },
          data: {
            status: "UPLOADING",
            uploadedChunks: survivingIndices.length,
            fileName,
            fileSize: parsedFileSize,
            totalChunks,
          },
        });

        return res.status(200).json({
          success: true,
          data: {
            status: resumed.status,
            uploadId: resumed.id,
            uploadedChunks: survivingIndices,
          },
        });
      }

      // No recoverable state (dir missing or chunk shape changed) - wipe
      // whatever remains and start this upload over from chunk 0.
      await fs.rm(uploadDir, { recursive: true, force: true });

      await chunkStore.deleteAllChunks(existingUpload.id);

      const restarted = await prisma.upload.update({
        where: { id: existingUpload.id },
        data: {
          status: "UPLOADING",
          uploadedChunks: 0,
          fileName,
          fileSize: parsedFileSize,
          totalChunks,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          status: restarted.status,
          uploadId: restarted.id,
          uploadedChunks: [],
        },
      });
    }

    const uploadedIndices = await chunkStore.getAllChunkIndices(
      existingUpload.id,
    );

    return res.status(200).json({
      success: true,
      data: {
        status: existingUpload.status,
        uploadId: existingUpload.id,
        uploadedChunks: uploadedIndices,
      },
    });
  } catch (error) {
    console.error("uploadInit error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
