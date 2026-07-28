import { type Request, type Response } from "express";
import { prisma } from "../../db/prisma.js";
import { type ListUploadsQuery } from "../../schemas/upload.schema.js";

export const listUploadsService = async (req: Request, res: Response) => {
  try {
    const { status, take, skip } = req.query as unknown as ListUploadsQuery;

    const where = status ? { status } : {};

    const [uploads, total] = await Promise.all([
      prisma.upload.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.upload.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        items: uploads.map((upload) => ({
          ...upload,
          fileSize: Number(upload.fileSize),
        })),
        total,
        take,
        skip,
      },
    });
  } catch (error) {
    console.error("listUploads error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
