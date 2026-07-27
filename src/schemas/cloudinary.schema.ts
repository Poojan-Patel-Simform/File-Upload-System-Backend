import { z } from "zod";

export const signCloudinaryUploadBodySchema = z.object({
  publicId: z.string().min(1),
  fileHash: z.string().min(1),
});

export type SignCloudinaryUploadBody = z.infer<
  typeof signCloudinaryUploadBodySchema
>;

export const saveCloudinaryAssetBodySchema = z.object({
  publicId: z.string().min(1),
  fileHash: z.string().min(1),
  url: z.string().url(),
});

export type SaveCloudinaryAssetBody = z.infer<
  typeof saveCloudinaryAssetBodySchema
>;
