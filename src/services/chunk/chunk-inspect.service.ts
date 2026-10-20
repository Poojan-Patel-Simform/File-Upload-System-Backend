import { type Request, type Response } from "express";
import { prisma } from "../../db/prisma.js";
import * as chunkStore from "./chunk-store.js";

/** Parses a route param into a non-negative integer chunk index; null if invalid. */
const parseChunkIndex = (raw: unknown): number | null => {
  if (typeof raw !== "string") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
};

/** Lists chunk indices recorded in Redis for an upload, plus the ones still missing. */
export const listChunksService = async (req: Request, res: Response) => {
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

    const receivedChunks = await chunkStore.getAllChunks(uploadId);
    const receivedIndices = new Set(receivedChunks.map((c) => c.chunkIndex));
    // Every index in 0..totalChunks-1 that Redis hasn't recorded
    const missingChunks = Array.from(
      { length: upload.totalChunks },
      (_, i) => i,
    ).filter((i) => !receivedIndices.has(i));

    return res.status(200).json({
      success: true,
      data: {
        uploadId,
        totalChunks: upload.totalChunks,
        receivedChunks,
        missingChunks,
      },
    });
  } catch (error) {
    console.error("listChunks error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/** Returns the stored checksum of one chunk (null if the client sent none). */
export const getChunkService = async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;
    const chunkIndex = parseChunkIndex(req.params.chunkIndex);

    if (typeof uploadId !== "string" || chunkIndex === null) {
      return res.status(400).json({
        success: false,
        message: "uploadId and a non-negative integer chunkIndex are required",
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

    const checksum = await chunkStore.getChunk(uploadId, chunkIndex);

    // null = no such chunk in Redis; "" = chunk exists without a checksum
    if (checksum === null) {
      return res.status(404).json({
        success: false,
        message: "Chunk not found for this upload",
        error: "Not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        uploadId,
        chunkIndex,
        checksum: checksum === "" ? null : checksum,
      },
    });
  } catch (error) {
    console.error("getChunk error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/** Removes one chunk's record from Redis (the file on disk is untouched). */
export const deleteChunkService = async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;
    const chunkIndex = parseChunkIndex(req.params.chunkIndex);

    if (typeof uploadId !== "string" || chunkIndex === null) {
      return res.status(400).json({
        success: false,
        message: "uploadId and a non-negative integer chunkIndex are required",
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

    await chunkStore.deleteChunkFields(uploadId, [chunkIndex]);

    return res.status(200).json({
      success: true,
      data: { uploadId, chunkIndex, deleted: true },
    });
  } catch (error) {
    console.error("deleteChunk error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Redis-only reset: clears the chunk-progress hash for this upload so a
// client-side visualization tool can inspect/reset "what chunks does Redis
// think it has" without affecting Postgres status/uploadedChunks or the
// on-disk chunk files. Use DELETE /api/uploads/:uploadId (abort) to actually
// cancel an in-progress upload.
export const deleteAllChunksService = async (req: Request, res: Response) => {
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

    await chunkStore.deleteAllChunks(uploadId);

    return res.status(200).json({
      success: true,
      data: { uploadId, deleted: true },
    });
  } catch (error) {
    console.error("deleteAllChunks error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
