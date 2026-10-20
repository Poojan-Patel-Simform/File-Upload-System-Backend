import "dotenv/config";
import { Redis } from "ioredis";

/** Shared Redis client; defaults to the docker-compose port. */
const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6380");

export { redis };
