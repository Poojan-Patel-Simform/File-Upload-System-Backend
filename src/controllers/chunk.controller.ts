import { type Request, type Response } from "express";
import {
  listChunksService,
  getChunkService,
  deleteChunkService,
  deleteAllChunksService,
} from "../services/chunk/chunk-inspect.service.js";

export const listChunks = async (req: Request, res: Response) => {
  await listChunksService(req, res);
};

export const getChunkStatus = async (req: Request, res: Response) => {
  await getChunkService(req, res);
};

export const deleteChunk = async (req: Request, res: Response) => {
  await deleteChunkService(req, res);
};

export const deleteAllChunksForUpload = async (
  req: Request,
  res: Response,
) => {
  await deleteAllChunksService(req, res);
};
