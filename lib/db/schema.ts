import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["student", "admin"]);
export const attendanceAction = pgEnum("attendance_action", ["checked-in", "checked-out"]);
export const inspectionType = pgEnum("inspection_type", ["check-in", "check-out"]);
export const maintenanceStatus = pgEnum("maintenance_status", ["open", "in-progress", "fixed"]);
export const transferStatus = pgEnum("transfer_status", ["pending", "approved", "rejected"]);
export const complaintStatus = pgEnum("complaint_status", ["open", "reviewed", "resolved"]);
export const foundStatus = pgEnum("found_status", ["open", "claimed", "returned"]);
export const foundItemType = pgEnum("found_item_type", ["lost", "found"]);
export const paymentMethod = pgEnum("payment_method", ["Airtel Money", "TNM Mpamba", "Bank", "Cash"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("student"),
  regNo: text("reg_no").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roomAssignments = pgTable("room_assignments", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hostel: text("hostel").notNull(),
  room: text("room").notNull(),
  active: boolean("active").notNull().default(true),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("room_assignments_one_active_idx").on(table.studentId).where(sql`${table.active}`)]);

export const checkinEvents = pgTable("checkin_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: attendanceAction("action").notNull(),
  gate: text("gate").notNull(),
  eventAt: timestamp("event_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roomInspections = pgTable("room_inspections", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hostel: text("hostel").notNull(),
  room: text("room").notNull(),
  type: inspectionType("type").notNull(),
  notes: text("notes").notNull(),
  photos: text("photos").array().notNull().default([]),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const receipts = pgTable("receipts", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trackingNo: text("tracking_no").notNull().unique(),
  amount: integer("amount").notNull(),
  method: paymentMethod("method").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("verified"),
});

export const maintenanceRequests = pgTable("maintenance_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  hostel: text("hostel").notNull(),
  room: text("room").notNull(),
  status: maintenanceStatus("status").notNull().default("open"),
  verificationNotes: text("verification_notes"),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});

export const maintenanceVotes = pgTable("maintenance_votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").notNull().references(() => maintenanceRequests.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (table) => [uniqueIndex("maintenance_votes_request_student_idx").on(table.requestId, table.studentId)]);

export const transferRequests = pgTable("transfer_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentHostel: text("current_hostel").notNull(),
  currentRoom: text("current_room").notNull(),
  requestedHostel: text("requested_hostel").notNull(),
  requestedRoom: text("requested_room").notNull(),
  reason: text("reason").notNull(),
  status: transferStatus("status").notNull().default("pending"),
  reviewNotes: text("review_notes"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const noiseComplaints = pgTable("noise_complaints", {
  id: uuid("id").defaultRandom().primaryKey(),
  location: text("location").notNull(),
  message: text("message").notNull(),
  status: complaintStatus("status").notNull().default("open"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

export const lostFoundItems = pgTable("lost_found_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  claimedById: uuid("claimed_by_id").references(() => users.id, { onDelete: "set null" }),
  type: foundItemType("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  photo: text("photo"),
  status: foundStatus("status").notNull().default("open"),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
});
