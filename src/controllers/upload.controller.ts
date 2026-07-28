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

const initUpload = async (req: Request, res: Response) => {
  await initUploadService(req, res);
};

const chunkFileUpload = async (req: Request, res: Response) => {
  await chunkUploadService(req, res);
};

const singleFileUpload = async (req: Request, res: Response) => {
  await singleFileUploadService(req, res);
};

const getUploadStatus = async (req: Request, res: Response) => {
  await uploadStatusService(req, res);
};

const abortUpload = async (req: Request, res: Response) => {
  await abortUploadService(req, res);
};

const listUploads = async (req: Request, res: Response) => {
  await listUploadsService(req, res);
};

const getUploadDetail = async (req: Request, res: Response) => {
  await uploadDetailService(req, res);
};

const downloadUpload = async (req: Request, res: Response) => {
  await uploadDownloadService(req, res);
};

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
