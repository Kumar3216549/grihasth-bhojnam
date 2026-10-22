import "dotenv/config";
import { defineConfig } from "prisma/config";

// CLI (db push / migrate) prefers the direct (unpooled) connection that Neon/Vercel provide.
// A placeholder is used when no database is configured, so `prisma generate` still works during install.
const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: { url },
});
