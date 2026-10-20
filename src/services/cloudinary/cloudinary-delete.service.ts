import { type Request, type Response } from "express";
import { createHash } from "node:crypto";
import "dotenv/config";
import { prisma } from "../../db/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

/** Deletes an image on Cloudinary by publicId via a signed request; returns Cloudinary's result (e.g. ok). */
// Cloudinary's destroy endpoint is resource-type-specific (image/video/raw).
// CloudinaryAsset has no stored resourceType column, and this integration
// currently only handles image uploads, so this always targets /image/destroy.
const destroyOnCloudinary = async (publicId: string): Promise<string> => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary signature: SHA-1 of the sorted params + API secret
  const signature = createHash("sha1")
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    {
      method: "POST",
      body: new URLSearchParams({
        public_id: publicId,
        timestamp: String(timestamp),
        api_key: apiKey,
        signature,
      }),
    },
  );

  const result = (await response.json()) as { result?: string };
  return result.result ?? "unknown";
};

/** Deletes an asset from Cloudinary, then removes its DB row. */
export const deleteCloudinaryAssetService = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "id must be a single path segment",
        error: "Bad request",
      });
    }

    const asset = await prisma.cloudinaryAsset.findUnique({ where: { id } });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Cloudinary asset not found",
        error: "Not found",
      });
    }

    // Delete remotely first; if that fails keep the DB row so it can be retried
    let cloudinaryResult: string;
    try {
      cloudinaryResult = await destroyOnCloudinary(asset.publicId);
    } catch (destroyError) {
      console.error("cloudinary destroy error:", destroyError);
      return res.status(502).json({
        success: false,
        message: "Failed to delete asset from Cloudinary",
        error:
          destroyError instanceof Error
            ? destroyError.message
            : "Unknown error",
      });
    }

    try {
      // P2025 = row already gone (concurrent delete): ignore it, rethrow anything else
      await prisma.cloudinaryAsset.delete({ where: { id } });
    } catch (dbError) {
      if (
        !(
          dbError instanceof Prisma.PrismaClientKnownRequestError &&
          dbError.code === "P2025"
        )
      ) {
        throw dbError;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id,
        publicId: asset.publicId,
        cloudinaryResult,
        message: "Cloudinary asset permanently deleted",
      },
    });
  } catch (error) {
    console.error("deleteCloudinaryAsset error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
