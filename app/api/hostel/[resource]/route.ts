import { and, count, desc, eq, inArray } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { getDb } from "@/lib/db";
import {
  checkinEvents,
  lostFoundItems,
  maintenanceRequests,
  maintenanceVotes,
  noiseComplaints,
  receipts,
  roomAssignments,
  roomInspections,
  transferRequests,
  users,
} from "@/lib/db/schema";
import { requireUser } from "@/lib/server-auth";

type RouteContext = { params: Promise<{ resource: string }> };
type Body = Record<string, unknown>;

const methods = ["Airtel Money", "TNM Mpamba", "Bank", "Cash"] as const;
const attendanceActions = ["checked-in", "checked-out"] as const;
const maintenanceStates = ["open", "in-progress", "fixed"] as const;
const transferStates = ["approved", "rejected"] as const;
const complaintStates = ["reviewed", "resolved"] as const;
const foundStates = ["claimed", "returned"] as const;

function isText(value: unknown, max = 2000): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

async function bodyOf(request: Request): Promise<Body> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new Response("Request body must be valid JSON.", { status: 400 });
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Response("Invalid request body.", { status: 400 });
  return value as Body;
}

async function assignmentFor(studentId: string) {
  const [assignment] = await getDb().select().from(roomAssignments)
    .where(and(eq(roomAssignments.studentId, studentId), eq(roomAssignments.active, true))).limit(1);
  if (!assignment) throw new Response("No active room assignment is recorded for this account.", { status: 409 });
  return assignment;
}

async function respondWithError(error: unknown) {
  if (error instanceof Response) return error;
  console.error("Hostel API request failed:", error);
  return Response.json({ error: "The request could not be completed. Check the server and database logs." }, { status: 500 });
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { resource } = await params;
    if (resource === "noise") {
      await requireUser("admin");
      const db = getDb();
      return Response.json(await db.select().from(noiseComplaints).orderBy(desc(noiseComplaints.submittedAt)));
    }

    const user = await requireUser();
    const db = getDb();
    if (resource === "assignment") {
      if (user.role !== "student") throw new Response("Student account required.", { status: 403 });
      const [assignment] = await db.select().from(roomAssignments)
        .where(and(eq(roomAssignments.studentId, user.id), eq(roomAssignments.active, true))).limit(1);
      return Response.json(assignment ?? null);
    }
    if (resource === "checkins") {
      return Response.json(await db.select().from(checkinEvents).where(eq(checkinEvents.studentId, user.id)).orderBy(desc(checkinEvents.eventAt)).limit(100));
    }
    if (resource === "maintenance") {
      const rows = await db.select({ item: maintenanceRequests, votes: count(maintenanceVotes.id) })
        .from(maintenanceRequests).leftJoin(maintenanceVotes, eq(maintenanceVotes.requestId, maintenanceRequests.id))
        .groupBy(maintenanceRequests.id).orderBy(desc(maintenanceRequests.reportedAt));
      const voted = user.role === "student"
        ? await db.select({ requestId: maintenanceVotes.requestId }).from(maintenanceVotes).where(eq(maintenanceVotes.studentId, user.id))
        : [];
      const votedIds = new Set(voted.map((row) => row.requestId));
      return Response.json(rows.map(({ item, votes }) => ({ ...item, votes, votedByMe: votedIds.has(item.id) })));
    }
    if (resource === "receipts") {
      if (user.role === "admin") {
        return Response.json(await db.select({
          receipt: receipts, studentName: users.name, regNo: users.regNo,
        }).from(receipts).innerJoin(users, eq(receipts.studentId, users.id)).orderBy(desc(receipts.paidAt)));
      }
      return Response.json(await db.select().from(receipts).where(eq(receipts.studentId, user.id)).orderBy(desc(receipts.paidAt)));
    }
    if (resource === "inspections") {
      if (user.role === "admin") {
        return Response.json(await db.select({
          inspection: roomInspections, studentName: users.name, regNo: users.regNo,
        }).from(roomInspections).innerJoin(users, eq(roomInspections.studentId, users.id)).orderBy(desc(roomInspections.submittedAt)));
      }
      return Response.json(await db.select().from(roomInspections).where(eq(roomInspections.studentId, user.id)).orderBy(desc(roomInspections.submittedAt)));
    }
    if (resource === "transfers") {
      if (user.role === "admin") {
        return Response.json(await db.select({
          transfer: transferRequests, studentName: users.name, regNo: users.regNo,
        }).from(transferRequests).innerJoin(users, eq(transferRequests.studentId, users.id)).orderBy(desc(transferRequests.requestedAt)));
      }
      return Response.json(await db.select().from(transferRequests).where(eq(transferRequests.studentId, user.id)).orderBy(desc(transferRequests.requestedAt)));
    }
    if (resource === "lost-found") {
      const entries = await db.select({
        item: lostFoundItems, reporterName: users.name,
      }).from(lostFoundItems).innerJoin(users, eq(lostFoundItems.studentId, users.id)).orderBy(desc(lostFoundItems.reportedAt));
      return Response.json(entries.map(({ item, ...entry }) => {
        const { studentId, ...publicItem } = item;
        return { ...entry, item: publicItem, isOwner: studentId === user.id };
      }));
    }
    if (resource === "students") {
      await requireUser("admin");
      const rows = await db.select({
        id: users.id, name: users.name, email: users.email, regNo: users.regNo,
        hostel: roomAssignments.hostel, room: roomAssignments.room,
      }).from(users).leftJoin(roomAssignments, and(
        eq(roomAssignments.studentId, users.id), eq(roomAssignments.active, true),
      )).where(eq(users.role, "student")).orderBy(users.name);
      const ids = rows.map((row) => row.id);
      const latestEvents = ids.length
        ? await db.selectDistinctOn([checkinEvents.studentId], {
          studentId: checkinEvents.studentId, action: checkinEvents.action,
        }).from(checkinEvents).where(inArray(checkinEvents.studentId, ids))
          .orderBy(checkinEvents.studentId, desc(checkinEvents.eventAt))
        : [];
      const eventByStudent = new Map(latestEvents.map((event) => [event.studentId, event]));
      return Response.json(rows.map((row) => ({
        ...row,
        checkin: eventByStudent.get(row.id)?.action ?? "none",
      })));
    }
    if (resource === "summary") {
      await requireUser("admin");
      const [studentCount] = await db.select({ value: count() }).from(users).where(eq(users.role, "student"));
      const latestEvents = await db.selectDistinctOn([checkinEvents.studentId], {
        studentId: checkinEvents.studentId, action: checkinEvents.action,
      }).from(checkinEvents).orderBy(checkinEvents.studentId, desc(checkinEvents.eventAt));
      const [openIssues] = await db.select({ value: count() }).from(maintenanceRequests).where(inArray(maintenanceRequests.status, ["open", "in-progress"]));
      const [pendingTransfers] = await db.select({ value: count() }).from(transferRequests).where(eq(transferRequests.status, "pending"));
      const activity = await db.select({
        action: checkinEvents.action, gate: checkinEvents.gate, eventAt: checkinEvents.eventAt,
        name: users.name, regNo: users.regNo, hostel: roomAssignments.hostel,
      }).from(checkinEvents).innerJoin(users, eq(checkinEvents.studentId, users.id))
        .leftJoin(roomAssignments, and(eq(roomAssignments.studentId, users.id), eq(roomAssignments.active, true)))
        .orderBy(desc(checkinEvents.eventAt)).limit(10);
      return Response.json({
        students: studentCount.value,
        checkedInEvents: latestEvents.filter((event) => event.action === "checked-in").length,
        maintenance: openIssues.value,
        transfers: pendingTransfers.value,
        activity,
      });
    }
    return Response.json({ error: "Unknown resource." }, { status: 404 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { resource } = await params;
    const body = await bodyOf(request);

    if (resource === "noise") {
      if (!isText(body.location, 250) || !isText(body.message, 5000)) {
        return Response.json({ error: "A location and complaint message are required." }, { status: 400 });
      }
      const db = getDb();
      const [created] = await db.insert(noiseComplaints).values({
        location: body.location.trim(), message: body.message.trim(),
      }).returning();
      return Response.json(created, { status: 201 });
    }

    if (resource === "receipts") {
      await requireUser("admin");
      const db = getDb();
      if (typeof body.studentId !== "string" || !Number.isInteger(body.amount) || Number(body.amount) < 1
        || !methods.includes(body.method as typeof methods[number])) {
        return Response.json({ error: "Select a student and provide a positive amount and payment method." }, { status: 400 });
      }
      const [student] = await db.select().from(users).where(and(eq(users.id, body.studentId), eq(users.role, "student"))).limit(1);
      if (!student) return Response.json({ error: "Student account was not found." }, { status: 404 });
      const [created] = await db.insert(receipts).values({
        studentId: student.id,
        trackingNo: `MUB-RCPT-${randomBytes(5).toString("hex").toUpperCase()}`,
        amount: Number(body.amount),
        method: body.method as typeof methods[number],
      }).returning();
      return Response.json(created, { status: 201 });
    }

    const user = await requireUser("student");
    const db = getDb();
    if (resource === "checkins") {
      if (!attendanceActions.includes(body.action as typeof attendanceActions[number]) || !isText(body.gate, 150)) {
        return Response.json({ error: "Choose check-in or check-out and provide the gate location." }, { status: 400 });
      }
      await assignmentFor(user.id);
      const [latest] = await db.select().from(checkinEvents).where(eq(checkinEvents.studentId, user.id))
        .orderBy(desc(checkinEvents.eventAt)).limit(1);
      if ((body.action === "checked-in" && latest?.action === "checked-in")
        || (body.action === "checked-out" && latest?.action !== "checked-in")) {
        return Response.json({ error: body.action === "checked-in" ? "You are already checked in." : "Check in before checking out." }, { status: 409 });
      }
      const [created] = await db.insert(checkinEvents).values({
        studentId: user.id, action: body.action as typeof attendanceActions[number], gate: body.gate.trim(),
      }).returning();
      return Response.json(created, { status: 201 });
    }
    if (resource === "maintenance") {
      const assignment = await assignmentFor(user.id);
      if (!isText(body.title, 250)) return Response.json({ error: "Enter a short title for the issue." }, { status: 400 });
      const title = body.title.trim();
      const created = await db.transaction(async (tx) => {
        const [item] = await tx.insert(maintenanceRequests).values({
          studentId: user.id,
          title,
          description: typeof body.description === "string" ? body.description.trim().slice(0, 3000) : "",
          hostel: assignment.hostel,
          room: assignment.room,
        }).returning();
        await tx.insert(maintenanceVotes).values({ requestId: item.id, studentId: user.id });
        return item;
      });
      return Response.json(created, { status: 201 });
    }
    if (resource === "inspections") {
      const photos = body.photos;
      const assignment = await assignmentFor(user.id);
      if (!["check-in", "check-out"].includes(String(body.type)) || !isText(body.notes, 3000)
        || !Array.isArray(photos) || photos.length < 1 || photos.length > 4
        || !photos.every((photo) => typeof photo === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(photo) && photo.length <= 950_000)) {
        return Response.json({ error: "Select an inspection type, add notes, and upload 1–4 JPEG, PNG, or WebP images (max 700 KB each)." }, { status: 400 });
      }
      const [created] = await db.insert(roomInspections).values({
        studentId: user.id, type: body.type as "check-in" | "check-out", notes: body.notes.trim(),
        hostel: assignment.hostel, room: assignment.room, photos: photos as string[],
      }).returning();
      return Response.json(created, { status: 201 });
    }
    if (resource === "transfers") {
      const assignment = await assignmentFor(user.id);
      if (!isText(body.requestedHostel, 150) || !isText(body.requestedRoom, 40) || !isText(body.reason, 3000)) {
        return Response.json({ error: "Requested hostel, room, and reason are required." }, { status: 400 });
      }
      const [created] = await db.insert(transferRequests).values({
        studentId: user.id,
        currentHostel: assignment.hostel,
        currentRoom: assignment.room,
        requestedHostel: body.requestedHostel.trim(),
        requestedRoom: body.requestedRoom.trim(),
        reason: body.reason.trim(),
      }).returning();
      return Response.json(created, { status: 201 });
    }
    if (resource === "lost-found") {
      if (!["lost", "found"].includes(String(body.type)) || !isText(body.title, 250)
        || !isText(body.description, 3000) || !isText(body.location, 250)) {
        return Response.json({ error: "Type, item name, description, and location are required." }, { status: 400 });
      }
      if (body.photo && (typeof body.photo !== "string" || !/^data:image\/(jpeg|png|webp);base64,/.test(body.photo) || body.photo.length > 950_000)) {
        return Response.json({ error: "Image must be a JPEG, PNG, or WebP file no larger than 700 KB." }, { status: 400 });
      }
      const [created] = await db.insert(lostFoundItems).values({
        studentId: user.id,
        type: body.type as "lost" | "found",
        title: body.title.trim(),
        description: body.description.trim(),
        location: body.location.trim(),
        photo: typeof body.photo === "string" ? body.photo : null,
      }).returning();
      return Response.json(created, { status: 201 });
    }
    return Response.json({ error: "Unknown resource." }, { status: 404 });
  } catch (error) {
    return respondWithError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { resource } = await params;
    const body = await bodyOf(request);
    const user = await requireUser();
    const db = getDb();
    if (typeof body.id !== "string") return Response.json({ error: "A record id is required." }, { status: 400 });

    if (resource === "maintenance" && body.action === "vote") {
      if (user.role !== "student") throw new Response("Student account required.", { status: 403 });
      const [item] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, body.id)).limit(1);
      if (!item) return Response.json({ error: "Maintenance request not found." }, { status: 404 });
      const [vote] = await db.select().from(maintenanceVotes).where(and(
        eq(maintenanceVotes.requestId, item.id), eq(maintenanceVotes.studentId, user.id),
      )).limit(1);
      if (vote) await db.delete(maintenanceVotes).where(eq(maintenanceVotes.id, vote.id));
      else await db.insert(maintenanceVotes).values({ requestId: item.id, studentId: user.id });
      return Response.json({ voted: !vote });
    }
    if (resource === "maintenance") {
      await requireUser("admin");
      if (!maintenanceStates.includes(body.status as typeof maintenanceStates[number])) {
        return Response.json({ error: "Choose a valid maintenance status." }, { status: 400 });
      }
      const [updated] = await db.update(maintenanceRequests).set({
        status: body.status as typeof maintenanceStates[number],
        verificationNotes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : null,
        verifiedAt: new Date(),
      }).where(eq(maintenanceRequests.id, body.id)).returning();
      if (!updated) return Response.json({ error: "Maintenance request not found." }, { status: 404 });
      return Response.json(updated);
    }
    if (resource === "transfers") {
      await requireUser("admin");
      if (!transferStates.includes(body.status as typeof transferStates[number])) {
        return Response.json({ error: "Choose approved or rejected." }, { status: 400 });
      }
      const [transfer] = await db.select().from(transferRequests).where(eq(transferRequests.id, body.id)).limit(1);
      if (!transfer) return Response.json({ error: "Transfer request not found." }, { status: 404 });
      if (transfer.status !== "pending") return Response.json({ error: "This transfer request has already been reviewed." }, { status: 409 });
      await db.transaction(async (tx) => {
        const [updated] = await tx.update(transferRequests).set({
          status: body.status as typeof transferStates[number],
          reviewNotes: typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : null,
          reviewedAt: new Date(),
        }).where(and(eq(transferRequests.id, transfer.id), eq(transferRequests.status, "pending"))).returning();
        if (!updated) throw new Response("This transfer request has already been reviewed.", { status: 409 });
        if (body.status === "approved") {
          await tx.update(roomAssignments).set({ active: false }).where(and(
            eq(roomAssignments.studentId, transfer.studentId), eq(roomAssignments.active, true),
          ));
          await tx.insert(roomAssignments).values({
            studentId: transfer.studentId,
            hostel: transfer.requestedHostel,
            room: transfer.requestedRoom,
          });
        }
      });
      return Response.json({ ok: true });
    }
    if (resource === "noise") {
      await requireUser("admin");
      if (!complaintStates.includes(body.status as typeof complaintStates[number])) {
        return Response.json({ error: "Choose reviewed or resolved." }, { status: 400 });
      }
      const [updated] = await db.update(noiseComplaints).set({
        status: body.status as typeof complaintStates[number], reviewedAt: new Date(),
      }).where(eq(noiseComplaints.id, body.id)).returning();
      if (!updated) return Response.json({ error: "Noise complaint not found." }, { status: 404 });
      return Response.json(updated);
    }
    if (resource === "lost-found") {
      if (!foundStates.includes(body.status as typeof foundStates[number])) {
        return Response.json({ error: "Choose claimed or returned." }, { status: 400 });
      }
      if (user.role === "admin") {
        const [updated] = await db.update(lostFoundItems).set({
          status: body.status as typeof foundStates[number],
        }).where(eq(lostFoundItems.id, body.id)).returning();
        if (!updated) return Response.json({ error: "Item not found." }, { status: 404 });
        return Response.json(updated);
      }
      const [item] = await db.select().from(lostFoundItems).where(eq(lostFoundItems.id, body.id)).limit(1);
      if (!item || item.type !== "found" || item.status !== "open" || item.studentId === user.id) {
        return Response.json({ error: "This item is not available to claim." }, { status: 409 });
      }
      const [updated] = await db.update(lostFoundItems).set({
        status: "claimed", claimedById: user.id,
      }).where(and(eq(lostFoundItems.id, item.id), eq(lostFoundItems.status, "open"))).returning();
      if (!updated) return Response.json({ error: "This item has already been claimed." }, { status: 409 });
      return Response.json(updated);
    }
    return Response.json({ error: "Unknown resource." }, { status: 404 });
  } catch (error) {
    return respondWithError(error);
  }
}
