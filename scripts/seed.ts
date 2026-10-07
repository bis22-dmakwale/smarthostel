import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { users, roomAssignments } from "../lib/db/schema";
import { hashPassword } from "../lib/password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed the database.");

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema: { users, roomAssignments } });

async function seedUser(input: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "student";
  regNo?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(users).values({
    name: input.name,
    email,
    passwordHash: hashPassword(input.password),
    role: input.role,
    regNo: input.regNo,
  }).returning();
  return created;
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) throw new Error("Set SEED_ADMIN_PASSWORD before running the seed command.");

  await seedUser({
    name: process.env.SEED_ADMIN_NAME ?? "Hostel Administrator",
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@mubas.ac.mw",
    password: adminPassword,
    role: "admin",
  });

  const studentPassword = process.env.SEED_STUDENT_PASSWORD;
  if (studentPassword) {
    const student = await seedUser({
      name: process.env.SEED_STUDENT_NAME ?? "Demo Student",
      email: process.env.SEED_STUDENT_EMAIL ?? "student@mubas.ac.mw",
      password: studentPassword,
      role: "student",
      regNo: process.env.SEED_STUDENT_REG_NO ?? "BIS/22/EP/015",
    });
    const [assignment] = await db.select().from(roomAssignments).where(eq(roomAssignments.studentId, student.id)).limit(1);
    if (!assignment) {
      await db.insert(roomAssignments).values({
        studentId: student.id,
        hostel: process.env.SEED_STUDENT_HOSTEL ?? "Nyika",
        room: process.env.SEED_STUDENT_ROOM ?? "B12",
      });
    }
  }

  console.info("Database seed complete.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
