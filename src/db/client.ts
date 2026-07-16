import Database from "@tauri-apps/plugin-sql";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

// Must match the path registered with tauri-plugin-sql in src-tauri/src/lib.rs.
// Migrations are applied by the Rust plugin the first time this loads.
const DB_URL = "sqlite:career_os.db";

let sqlitePromise: Promise<Database> | null = null;

function getSqlite(): Promise<Database> {
  if (!sqlitePromise) {
    sqlitePromise = Database.load(DB_URL);
  }
  return sqlitePromise;
}

/**
 * Ensures the database is loaded (and migrations have run) before the app
 * starts issuing queries. Call once at startup.
 */
export async function initDb(): Promise<void> {
  await getSqlite();
}

/**
 * Drizzle client backed by tauri-plugin-sql via the sqlite-proxy driver.
 *
 * The proxy driver expects rows as positional value arrays, but
 * tauri-plugin-sql returns row objects. Because SQLite returns columns in
 * SELECT order and JS preserves object insertion order, `Object.values(row)`
 * reconstructs the positional array drizzle needs.
 */
export const db = drizzle(
  async (sql, params, method) => {
    const sqlite = await getSqlite();

    if (method === "run") {
      await sqlite.execute(sql, params);
      return { rows: [] };
    }

    const result = await sqlite.select<Record<string, unknown>[]>(sql, params);
    const rows = result.map((row) => Object.values(row));

    // `get` expects a single row's values; `all`/`values` expect an array of rows.
    return { rows: method === "get" ? (rows[0] ?? []) : rows };
  },
  { schema, casing: "snake_case" }
);

export { schema };
