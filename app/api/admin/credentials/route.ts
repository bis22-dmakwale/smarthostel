import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { roomAssignments, users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/password";
import { requireUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  try {
    await requireUser("admin");
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object") return Response.json({ error: "Invalid request." }, { status: 400 });
    const input = body as Record<string, unknown>;
    if (![input.name, input.email, input.regNo, input.hostel, input.room].every((value) =>
      typeof value === "string" && value.trim().length > 0)) {
      return Response.json({ error: "Name, email, registration number, hostel, and room are required." }, { status: 400 });
    }

    const password = `MUB-${randomBytes(6).toString("base64url")}`;
    const db = getDb();
    const values = {
      name: (input.name as string).trim(),
      email: (input.email as string).trim().toLowerCase(),
      regNo: (input.regNo as string).trim(),
      hostel: (input.hostel as string).trim(),
      room: (input.room as string).trim(),
    };
    const student = await db.transaction(async (tx) => {
      const [created] = await tx.insert(users).values({
        name: values.name,
        email: values.email,
        regNo: values.regNo,
        role: "student",
        passwordHash: hashPassword(password),
      }).returning({ id: users.id, name: users.name, email: users.email, regNo: users.regNo });
      await tx.insert(roomAssignments).values({
        studentId: created.id, hostel: values.hostel, room: values.room,
      });
      return created;
    });
    return Response.json({ ...student, ...values, password }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Credential issue failed:", error);
    const code = error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "23505") return Response.json({ error: "That email or registration number is already in use." }, { status: 409 });
    return Response.json({ error: "Unable to issue student credentials." }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireUser("admin");
    const students = await getDb().select({
      id: users.id, name: users.name, email: users.email, regNo: users.regNo,
    }).from(users).where(eq(users.role, "student")).orderBy(users.name);
    return Response.json(students);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Credential list failed:", error);
    return Response.json({ error: "Unable to load student accounts." }, { status: 500 });
  }
}
