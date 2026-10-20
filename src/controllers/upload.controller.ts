import { type Request, type Response } from "express";
import { chunkUploadService } from "../services/upload/chunk-upload.service.js";
import { initUploadService } from "../services/upload/init-upload.service.js";
import { singleFileUploadService } from "../services/upload/single-file-upload.service.js";
import { uploadStatusService } from "../services/upload/upload-status.service.js";
import { abortUploadService } from "../services/upload/abort-upload.service.js";
import { listUploadsService } from "../services/upload/upload-list.service.js";
import { uploadDetailService } from "../services/upload/upload-detail.service.js";
import { uploadDownloadService } from "../services/upload/upload-download.service.js";
import { uploadPermanentDeleteService } from "../services/upload/upload-delete.service.js";

// Controllers are thin wrappers; the logic lives in services/upload.

/** POST /init - start a chunked upload, or resume/dedupe an existing one. */
const initUpload = async (req: Request, res: Response) => {
  await initUploadService(req, res);
};

/** POST /chunk - receive one chunk; merges the file when all chunks arrive. */
const chunkFileUpload = async (req: Request, res: Response) => {
  await chunkUploadService(req, res);
};

/** POST /single - upload a whole file in one request. */
const singleFileUpload = async (req: Request, res: Response) => {
  await singleFileUploadService(req, res);
};

/** GET /:uploadId/status - upload progress summary. */
const getUploadStatus = async (req: Request, res: Response) => {
  await uploadStatusService(req, res);
};

/** DELETE /:uploadId - abort an in-progress upload and clean up its chunks. */
const abortUpload = async (req: Request, res: Response) => {
  await abortUploadService(req, res);
};

/** GET / - paginated list of uploads, optionally filtered by status. */
const listUploads = async (req: Request, res: Response) => {
  await listUploadsService(req, res);
};

/** GET /:uploadId - full upload record. */
const getUploadDetail = async (req: Request, res: Response) => {
  await uploadDetailService(req, res);
};

/** GET /:uploadId/download - download a completed file. */
const downloadUpload = async (req: Request, res: Response) => {
  await uploadDownloadService(req, res);
};

/** DELETE /:uploadId/permanent - delete files, DB row and Redis data. */
const permanentDeleteUpload = async (req: Request, res: Response) => {
  await uploadPermanentDeleteService(req, res);
};

export {
  initUpload,
  chunkFileUpload,
  singleFileUpload,
  getUploadStatus,
  abortUpload,
  listUploads,
  getUploadDetail,
  downloadUpload,
  permanentDeleteUpload,
};
