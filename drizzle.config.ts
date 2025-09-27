import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Ensure the Neon database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  // Configurações para sincronização completa
  migrations: {
    table: "drizzle_migrations",
    schema: "public"
  }
});
