import { type Request, type Response } from "express";
import {
  listChunksService,
  getChunkService,
  deleteChunkService,
  deleteAllChunksService,
} from "../services/chunk/chunk-inspect.service.js";

// Controllers are thin wrappers; the logic lives in services/chunk.

/** GET /:uploadId/chunks - received (Redis) and missing chunk indices. */
export const listChunks = async (req: Request, res: Response) => {
  await listChunksService(req, res);
};

/** GET /:uploadId/chunks/:chunkIndex - checksum of one stored chunk. */
export const getChunkStatus = async (req: Request, res: Response) => {
  await getChunkService(req, res);
};

/** DELETE /:uploadId/chunks/:chunkIndex - remove one chunk record from Redis. */
export const deleteChunk = async (req: Request, res: Response) => {
  await deleteChunkService(req, res);
};

/** DELETE /:uploadId/chunks - clear all chunk records in Redis for an upload. */
export const deleteAllChunksForUpload = async (
  req: Request,
  res: Response,
) => {
  await deleteAllChunksService(req, res);
};
