import { type Request, type Response } from "express";
import { signCloudinaryUploadService } from "../services/cloudinary/cloudinary-sign.service.js";
import { saveCloudinaryAssetService } from "../services/cloudinary/cloudinary-save.service.js";
import { listCloudinaryAssetsService } from "../services/cloudinary/cloudinary-list.service.js";
import { getCloudinaryAssetService } from "../services/cloudinary/cloudinary-detail.service.js";
import { deleteCloudinaryAssetService } from "../services/cloudinary/cloudinary-delete.service.js";

// Controllers are thin wrappers; the logic lives in services/cloudinary.

/** POST /sign - signed upload params, or the existing asset for duplicates. */
const signCloudinaryUpload = async (req: Request, res: Response) => {
  await signCloudinaryUploadService(req, res);
};

/** POST /save - store metadata of an uploaded asset. */
const saveCloudinaryAsset = async (req: Request, res: Response) => {
  await saveCloudinaryAssetService(req, res);
};

/** GET / - paginated list of assets. */
const listCloudinaryAssets = async (req: Request, res: Response) => {
  await listCloudinaryAssetsService(req, res);
};

/** GET /:id - one asset. */
const getCloudinaryAsset = async (req: Request, res: Response) => {
  await getCloudinaryAssetService(req, res);
};

/** DELETE /:id - delete from Cloudinary and the database. */
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
