import path from "node:path";

/** Temp storage for chunks of in-progress chunked uploads (one sub-folder per upload). */
export const CHUNK_DIR = path.resolve("storage/chunks");

/** Final files assembled from chunks. */
export const MERGED_DIR = path.resolve("storage/merged");

/** Files uploaded in a single request. */
export const TRADITIONAL_UPLOAD_DIR = path.resolve("storage/traditional");
