import type { Client } from "@libsql/client";
import { ADDED_COLUMNS, BOOTSTRAP_SQL } from "./schema";

/** Creates missing tables/columns. Safe to run on every start. */
export async function ensureSchema(client: Client) {
  await client.batch(BOOTSTRAP_SQL, "write");
  for (const [table, column, definition] of ADDED_COLUMNS) {
    const { rows } = await client.execute(`PRAGMA table_info(${table})`);
    if (!rows.some((r) => r.name === column)) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
}
