import { type Request, type Response, type NextFunction } from "express";
import { fileTypeFromBuffer } from "file-type";

/**
 * Rejects the file if its real type (from its bytes) differs from the declared mimetype.
 * Skips the check when there is no file or detection fails.
 */
export const verifyContentType = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const file = req.file as Express.Multer.File | undefined;
  // Nothing to verify; the next handler reports a missing file
  if (!file || !file.buffer) return next();

  try {
    // Detect the type from magic bytes, not the client-supplied header
    const detected = await fileTypeFromBuffer(file.buffer);

    if (detected && file.mimetype && detected.mime !== file.mimetype) {
      return res.status(400).json({
        success: false,
        message: `File content (${detected.mime}) does not match declared type (${file.mimetype})`,
        error: "Bad request",
      });
    }

    return next();
  } catch (error) {
    // Fail open: a detection error shouldn't block the upload
    console.error("verifyContentType error:", error);
    return next();
  }
};
