import { defineConfig } from "drizzle-kit";

// Drizzle is the source of truth for the schema. `drizzle-kit generate` emits
// SQL migrations into src-tauri/migrations, which the Rust side embeds and runs
// on startup via tauri-plugin-sql.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./src-tauri/migrations",
});
