import { z } from "zod";

/** Body of POST /sign: desired publicId and the file hash (used for dedupe). */
export const signCloudinaryUploadBodySchema = z.object({
  publicId: z.string().min(1),
  fileHash: z.string().min(1),
});

export type SignCloudinaryUploadBody = z.infer<
  typeof signCloudinaryUploadBodySchema
>;

/** Body of POST /save: Cloudinary publicId, file hash and the resulting url. */
export const saveCloudinaryAssetBodySchema = z.object({
  publicId: z.string().min(1),
  fileHash: z.string().min(1),
  url: z.string().url(),
});

export type SaveCloudinaryAssetBody = z.infer<
  typeof saveCloudinaryAssetBodySchema
>;

/** Query of GET /: pagination (take max 100, default 20). */
export const listCloudinaryAssetsQuerySchema = z.object({
  take: z.coerce.number().int().positive().max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
});

export type ListCloudinaryAssetsQuery = z.infer<
  typeof listCloudinaryAssetsQuerySchema
>;
