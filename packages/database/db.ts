import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
});
console.log("DEBUG DATABASE_URL:", process.env.DATABASE_URL);

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});

// Re-export generated Prisma enums/types so consumers can import them from the package root
export * from "./generated/prisma/enums";
