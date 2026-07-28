import { type Request, type Response } from "express";
import { prisma } from "../../db/prisma.js";

export const getCloudinaryAssetService = async (
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

    return res.status(200).json({ success: true, data: asset });
  } catch (error) {
    console.error("getCloudinaryAsset error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
