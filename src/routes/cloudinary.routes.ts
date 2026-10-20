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

/** Cloudinary asset routes, mounted at /api/cloudinary. */
const cloudinaryRouter = Router();

// Get a signed upload payload (or the existing asset if the file is a duplicate)
cloudinaryRouter.post(
  "/sign",
  validateBody(signCloudinaryUploadBodySchema),
  signCloudinaryUpload,
);

// Save asset metadata after the client finished uploading to Cloudinary
cloudinaryRouter.post(
  "/save",
  validateBody(saveCloudinaryAssetBodySchema),
  saveCloudinaryAsset,
);

// List assets (paginated)
cloudinaryRouter.get(
  "/",
  validateQuery(listCloudinaryAssetsQuerySchema),
  listCloudinaryAssets,
);

// Get one asset
cloudinaryRouter.get("/:id", getCloudinaryAsset);

// Delete an asset from Cloudinary and the database
cloudinaryRouter.delete("/:id", deleteCloudinaryAsset);

export default cloudinaryRouter;
