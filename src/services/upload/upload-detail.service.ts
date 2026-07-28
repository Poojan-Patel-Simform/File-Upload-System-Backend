import { type Request, type Response } from "express";
import { prisma } from "../../db/prisma.js";

export const uploadDetailService = async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;

    if (typeof uploadId !== "string") {
      return res.status(400).json({
        success: false,
        message: "uploadId must be a single path segment",
        error: "Bad request",
      });
    }

    const upload = await prisma.upload.findUnique({ where: { id: uploadId } });

    if (!upload) {
      return res.status(404).json({
        success: false,
        message: "Upload not found",
        error: "Not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...upload,
        fileSize: Number(upload.fileSize),
      },
    });
  } catch (error) {
    console.error("uploadDetail error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
