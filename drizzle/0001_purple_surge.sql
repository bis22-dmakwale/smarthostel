ALTER TABLE "room_inspections" ADD COLUMN "hostel" text NOT NULL;--> statement-breakpoint
ALTER TABLE "room_inspections" ADD COLUMN "room" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "room_assignments_one_active_idx" ON "room_assignments" USING btree ("student_id") WHERE "room_assignments"."active";