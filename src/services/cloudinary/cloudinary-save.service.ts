import { type Request, type Response } from "express";
import { prisma } from "../../db/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { type SaveCloudinaryAssetBody } from "../../schemas/cloudinary.schema.js";

/**
 * Saves a Cloudinary asset's metadata after the client uploaded it.
 * Idempotent: if the asset already exists, the existing record is returned.
 */
export const saveCloudinaryAssetService = async (
  req: Request,
  res: Response,
) => {
  const { publicId, fileHash, url } = req.body as SaveCloudinaryAssetBody;

  try {
    const asset = await prisma.cloudinaryAsset.create({
      data: { publicId, fileHash, url },
    });

    return res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    // P2002 = unique constraint violation (publicId or fileHash already saved)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Which unique field(s) collided
      const target = error.meta?.target;
      const targets = Array.isArray(target) ? target : [];

      // Return the conflicting record so retries are harmless
      const existing = targets.includes("publicId")
        ? await prisma.cloudinaryAsset.findUnique({ where: { publicId } })
        : (await prisma.cloudinaryAsset.findUnique({ where: { fileHash } })) ??
          (await prisma.cloudinaryAsset.findUnique({ where: { publicId } }));

      if (existing) {
        return res.status(200).json({ success: true, data: existing });
      }
    }

    console.error("saveCloudinaryAsset error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
