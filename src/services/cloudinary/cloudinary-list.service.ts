import { type Request, type Response } from "express";
import { prisma } from "../../db/prisma.js";
import { type ListCloudinaryAssetsQuery } from "../../schemas/cloudinary.schema.js";

/** Returns a paginated list of Cloudinary assets, newest first. */
export const listCloudinaryAssetsService = async (
  req: Request,
  res: Response,
) => {
  try {
    const { take, skip } = req.query as unknown as ListCloudinaryAssetsQuery;

    // Fetch the page and the overall count in parallel
    const [items, total] = await Promise.all([
      prisma.cloudinaryAsset.findMany({
        take,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.cloudinaryAsset.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: { items, total, take, skip },
    });
  } catch (error) {
    console.error("listCloudinaryAssets error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
