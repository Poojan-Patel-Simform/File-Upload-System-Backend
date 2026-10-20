import { redis } from "../../db/redis.js";

/** Chunk records expire after 24h so abandoned uploads don't linger in Redis. */
export const CHUNK_TTL_SECONDS = 24 * 60 * 60;

/** A received chunk; checksum is null when the client sent none. */
export type StoredChunk = {
  chunkIndex: number;
  checksum: string | null;
};

/** Redis hash key for an upload's chunks (field = chunkIndex, value = checksum). */
const chunkKey = (uploadId: string) => `upload:chunks:${uploadId}`;

/** Records a received chunk and refreshes the key's expiry; re-adding an index overwrites it. */
export const addChunk = async (
  uploadId: string,
  chunkIndex: number,
  checksum: string | null,
) => {
  const key = chunkKey(uploadId);
  // Hash values are strings; "" stands for "no checksum"
  await redis.hset(key, String(chunkIndex), checksum ?? "");
  await redis.expire(key, CHUNK_TTL_SECONDS);
};

/** Returns the chunk's checksum ("" if none), or null if the chunk isn't recorded. */
export const getChunk = async (
  uploadId: string,
  chunkIndex: number,
): Promise<string | null> => {
  const key = chunkKey(uploadId);
  return redis.hget(key, String(chunkIndex));
};

/** Returns the indices of all recorded chunks. */
export const getAllChunkIndices = async (
  uploadId: string,
): Promise<number[]> => {
  const key = chunkKey(uploadId);
  const fields = await redis.hkeys(key);
  return fields.map((field) => Number(field));
};

/** Returns all recorded chunks with their checksums. */
export const getAllChunks = async (
  uploadId: string,
): Promise<StoredChunk[]> => {
  const key = chunkKey(uploadId);
  const record = await redis.hgetall(key);
  return Object.entries(record).map(([chunkIndex, checksum]) => ({
    chunkIndex: Number(chunkIndex),
    checksum: checksum || null,
  }));
};

/** Removes the given chunk indices from an upload's Redis hash. */
export const deleteChunkFields = async (
  uploadId: string,
  indices: number[],
) => {
  if (indices.length === 0) return;
  const key = chunkKey(uploadId);

  await redis.hdel(key, ...indices.map(String));
};

/** Deletes every chunk record for an upload. */
export const deleteAllChunks = async (uploadId: string) => {
  const key = chunkKey(uploadId);

  await redis.del(key);
};
