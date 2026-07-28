import { Router } from "express";
import {
  signCloudinaryUpload,
  saveCloudinaryAsset,
  listCloudinaryAssets,
  getCloudinaryAsset,
  deleteCloudinaryAsset,
} from "../controllers/cloudinary.controller.js";
import {
  validateBody,
  validateQuery,
} from "../middlewares/validate.middleware.js";
import {
  signCloudinaryUploadBodySchema,
  saveCloudinaryAssetBodySchema,
  listCloudinaryAssetsQuerySchema,
} from "../schemas/cloudinary.schema.js";

const cloudinaryRouter = Router();

cloudinaryRouter.post(
  "/sign",
  validateBody(signCloudinaryUploadBodySchema),
  signCloudinaryUpload,
);

cloudinaryRouter.post(
  "/save",
  validateBody(saveCloudinaryAssetBodySchema),
  saveCloudinaryAsset,
);

cloudinaryRouter.get(
  "/",
  validateQuery(listCloudinaryAssetsQuerySchema),
  listCloudinaryAssets,
);

cloudinaryRouter.get("/:id", getCloudinaryAsset);

cloudinaryRouter.delete("/:id", deleteCloudinaryAsset);

export default cloudinaryRouter;
