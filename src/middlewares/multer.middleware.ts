import multer from "multer";

// Keep files in memory (req.file.buffer); services write them to disk
const storage = multer.memoryStorage();

const MB = 1024 * 1024;

/** Parses one `file` field for the single-file endpoint (max 500 MB). */
export const singleFileUploadMiddleware = multer({
  storage,
  limits: { fileSize: 500 * MB },
}).single("file");

/** Parses one `file` field for a chunk (max 64 MB). */
export const chunkUploadMiddleware = multer({
  storage,
  limits: { fileSize: 64 * MB },
}).single("file");
