import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { ensureSchema } from "./bootstrap";
import * as schema from "./schema";

type DB = LibSQLDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  __aitunesClient?: Client;
  __aitunesReady?: Promise<void>;
};

function getClient(): Client {
  if (!globalForDb.__aitunesClient) {
    globalForDb.__aitunesClient = createClient({
      url: process.env.DATABASE_URL ?? "file:local.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
  }
  return globalForDb.__aitunesClient;
}

async function bootstrap(client: Client) {
  await client.execute("PRAGMA foreign_keys = ON");
  await ensureSchema(client);
}

/** Returns a ready-to-use Drizzle instance (tables are created on first use). */
export async function getDb(): Promise<DB> {
  const client = getClient();
  if (!globalForDb.__aitunesReady) {
    globalForDb.__aitunesReady = bootstrap(client).catch((err) => {
      globalForDb.__aitunesReady = undefined;
      throw err;
    });
  }
  await globalForDb.__aitunesReady;
  return drizzle(client, { schema });
}
