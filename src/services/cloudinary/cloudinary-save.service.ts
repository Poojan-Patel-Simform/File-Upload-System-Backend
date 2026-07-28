import { type Request, type Response } from "express";
import { prisma } from "../../db/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { type SaveCloudinaryAssetBody } from "../../schemas/cloudinary.schema.js";

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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      const targets = Array.isArray(target) ? target : [];

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
