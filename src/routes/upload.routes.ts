import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  initUpload,
  chunkFileUpload,
  singleFileUpload,
  getUploadStatus,
  abortUpload,
} from "../controllers/upload.controller.js";
import {
  singleFileUploadMiddleware,
  chunkUploadMiddleware,
} from "../middlewares/multer.middleware.js";
import { verifyContentType } from "../middlewares/contentType.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  initUploadBodySchema,
  chunkUploadBodySchema,
} from "../schemas/upload.schema.js";

const uploadRouter = Router();

// Rate limiters for different upload endpoints
const initLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many upload-init requests from this IP, please try again later",
});

const singleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many upload requests from this IP, please try again later",
});

const chunkLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: "Too many chunk upload requests from this IP, please slow down",
});

// Upload initialization endpoint
uploadRouter.post(
  "/init",
  initLimiter,
  validateBody(initUploadBodySchema),
  initUpload,
);

// Single file upload endpoint
uploadRouter.post(
  "/single",
  singleLimiter,
  singleFileUploadMiddleware,
  verifyContentType,
  singleFileUpload,
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

export default uploadRouter;
