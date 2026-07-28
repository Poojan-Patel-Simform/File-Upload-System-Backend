import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  initUpload,
  chunkFileUpload,
  singleFileUpload,
  getUploadStatus,
  abortUpload,
  listUploads,
  getUploadDetail,
  downloadUpload,
  permanentDeleteUpload,
} from "../controllers/upload.controller.js";
import {
  listChunks,
  getChunkStatus,
  deleteChunk,
  deleteAllChunksForUpload,
} from "../controllers/chunk.controller.js";
import {
  singleFileUploadMiddleware,
  chunkUploadMiddleware,
} from "../middlewares/multer.middleware.js";
import { verifyContentType } from "../middlewares/contentType.middleware.js";
import {
  validateBody,
  validateQuery,
} from "../middlewares/validate.middleware.js";
import {
  initUploadBodySchema,
  chunkUploadBodySchema,
  listUploadsQuerySchema,
} from "../schemas/upload.schema.js";

const uploadRouter = Router();

// Rate limiters for different upload endpoints
const singleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many upload requests from this IP, please try again later",
});

const initLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many upload-init requests from this IP, please try again later",
});

const chunkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many chunk upload requests from this IP, please slow down",
});

// Single file upload endpoint
uploadRouter.post(
  "/single",
  singleLimiter,
  singleFileUploadMiddleware,
  verifyContentType,
  singleFileUpload,
);

// Upload initialization endpoint
uploadRouter.post(
  "/init",
  initLimiter,
  validateBody(initUploadBodySchema),
  initUpload,
);

// Chunked file upload endpoint
uploadRouter.post(
  "/chunk",
  chunkLimiter,
  chunkUploadMiddleware,
  validateBody(chunkUploadBodySchema),
  chunkFileUpload,
);

// Endpoint to get the status of an upload
uploadRouter.get("/:uploadId/status", getUploadStatus);

// Endpoint to abort an ongoing upload
uploadRouter.delete("/:uploadId", abortUpload);

// List uploads
uploadRouter.get("/", validateQuery(listUploadsQuerySchema), listUploads);

// Read one upload's full record
uploadRouter.get("/:uploadId", getUploadDetail);

// Download a completed upload's file
uploadRouter.get("/:uploadId/download", downloadUpload);

// Permanently delete an upload (disk file + DB row + Redis cleanup)
uploadRouter.delete("/:uploadId/permanent", permanentDeleteUpload);

// Redis chunk-inspection endpoints
uploadRouter.get("/:uploadId/chunks", listChunks);
uploadRouter.get("/:uploadId/chunks/:chunkIndex", getChunkStatus);
uploadRouter.delete("/:uploadId/chunks/:chunkIndex", deleteChunk);
uploadRouter.delete("/:uploadId/chunks", deleteAllChunksForUpload);

export default uploadRouter;
