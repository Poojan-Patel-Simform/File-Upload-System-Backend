import { type Request, type Response } from "express";
import { signCloudinaryUploadService } from "../services/cloudinary/cloudinary-sign.service.js";
import { saveCloudinaryAssetService } from "../services/cloudinary/cloudinary-save.service.js";
import { listCloudinaryAssetsService } from "../services/cloudinary/cloudinary-list.service.js";
import { getCloudinaryAssetService } from "../services/cloudinary/cloudinary-detail.service.js";
import { deleteCloudinaryAssetService } from "../services/cloudinary/cloudinary-delete.service.js";

const signCloudinaryUpload = async (req: Request, res: Response) => {
  await signCloudinaryUploadService(req, res);
};

const saveCloudinaryAsset = async (req: Request, res: Response) => {
  await saveCloudinaryAssetService(req, res);
};

const listCloudinaryAssets = async (req: Request, res: Response) => {
  await listCloudinaryAssetsService(req, res);
};

const getCloudinaryAsset = async (req: Request, res: Response) => {
  await getCloudinaryAssetService(req, res);
};

const deleteCloudinaryAsset = async (req: Request, res: Response) => {
  await deleteCloudinaryAssetService(req, res);
};

export {
  signCloudinaryUpload,
  saveCloudinaryAsset,
  listCloudinaryAssets,
  getCloudinaryAsset,
  deleteCloudinaryAsset,
};
