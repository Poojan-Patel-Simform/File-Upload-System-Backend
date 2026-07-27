import { type Request, type Response } from "express";
import { signCloudinaryUploadService } from "../services/cloudinary-sign.service.js";
import { saveCloudinaryAssetService } from "../services/cloudinary-save.service.js";

const signCloudinaryUpload = async (req: Request, res: Response) => {
  await signCloudinaryUploadService(req, res);
};

const saveCloudinaryAsset = async (req: Request, res: Response) => {
  await saveCloudinaryAssetService(req, res);
};

export { signCloudinaryUpload, saveCloudinaryAsset };
