import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// Postgres connection string from env
const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });

/** Shared Prisma client (Postgres via the pg driver adapter). */
const prisma = new PrismaClient({ adapter });

export { prisma };
