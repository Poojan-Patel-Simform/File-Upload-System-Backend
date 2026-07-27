import { Router } from "express";
import {
  signCloudinaryUpload,
  saveCloudinaryAsset,
} from "../controllers/cloudinary.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  signCloudinaryUploadBodySchema,
  saveCloudinaryAssetBodySchema,
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

export default cloudinaryRouter;
