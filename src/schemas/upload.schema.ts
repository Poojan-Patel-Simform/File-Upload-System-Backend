import { z } from "zod";

/** Body of POST /init. fileSize may be a string or number and is converted to BigInt. */
export const initUploadBodySchema = z.object({
  fileHash: z.string().min(1),
  fileName: z.string().min(1),
  fileSize: z
    .union([z.string(), z.number()])
    .transform((val, ctx) => {
      try {
        return BigInt(val);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "fileSize must be a valid integer",
        });
        return z.NEVER;
      }
    }),
  totalChunks: z.number().int().positive(),
});

export type InitUploadBody = z.infer<typeof initUploadBodySchema>;

/** Form fields of POST /chunk. chunkIndex arrives as a string, so it is coerced; checksum (SHA-256 of the chunk) is optional. */
export const chunkUploadBodySchema = z.object({
  uploadId: z.string().min(1),
  chunkIndex: z.coerce.number().int().nonnegative(),
  checksum: z.string().min(1).optional(),
});

export type ChunkUploadBody = z.infer<typeof chunkUploadBodySchema>;

/** Query of GET /: optional status filter plus pagination (take max 100). */
export const listUploadsQuerySchema = z.object({
  status: z
    .enum(["NEW", "UPLOADING", "MERGING", "COMPLETED", "FAILED"])
    .optional(),
  take: z.coerce.number().int().positive().max(100).default(20),
  skip: z.coerce.number().int().nonnegative().default(0),
});

export type ListUploadsQuery = z.infer<typeof listUploadsQuerySchema>;
