import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json({ status: "error", database: "not-configured" }, { status: 503 });
  }
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error);
    return Response.json({ status: "error", database: "unavailable" }, { status: 503 });
  }
}
