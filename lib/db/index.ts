import "server-only";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  hostelPostgres?: ReturnType<typeof postgres>;
};

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Add it to smarthostel/.env.");
  }
  const client = globalForDb.hostelPostgres ??= postgres(connectionString, {
    max: 10,
    prepare: false,
  });
  return drizzle(client, { schema });
}
