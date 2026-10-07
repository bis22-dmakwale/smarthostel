"use client";
import { useState } from "react";
import { ScanLine } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { apiRequest } from "@/lib/api";
import { useApiResource } from "@/components/hostel/useApiResource";

type Event = { id: string; action: "checked-in" | "checked-out"; gate: string; eventAt: string };
type Assignment = { hostel: string; room: string } | null;

export default function CheckinPage() {
  const history = useApiResource<Event[]>("/api/hostel/checkins");
  const assignment = useApiResource<Assignment>("/api/hostel/assignment");
  const [busy, setBusy] = useState(false);

  const lastEvent = history.data?.[0];
  const currentStatus = lastEvent?.action ?? "none";

  async function record(action: Event["action"]) {
    setBusy(true);
    history.setError("");
    try {
      await apiRequest("/api/hostel/checkins", {
        method: "POST",
        body: JSON.stringify({ action, gate: "Hostel gate" }),
      });
      await history.refresh();
    } catch (cause) {
      history.setError(cause instanceof Error ? cause.message : "Unable to record this visit.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <Card style={{ textAlign: "center", padding: 28 }}>
        <div style={{
          width: 160, height: 160, margin: "0 auto 16px", borderRadius: 16,
          border: "3px dashed var(--primary)", display: "grid", placeItems: "center",
          background: "var(--primary-light)",
        }}><ScanLine size={58} strokeWidth={1.4} color="var(--primary)" /></div>
        <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Digital check-in / check-out</h2>
        <p className="muted" style={{ margin: "8px 0 16px" }}>
          {assignment.data ? `${assignment.data.hostel} · Room ${assignment.data.room}` : "Your active room assignment is required."}
        </p>
        <div className="grid grid-2">
          <Button disabled={busy || currentStatus === "checked-in" || !assignment.data} onClick={() => void record("checked-in")}>
            Check in
          </Button>
          <Button variant="ghost" disabled={busy || currentStatus !== "checked-in" || !assignment.data} onClick={() => void record("checked-out")}>
            Check out
          </Button>
        </div>
        {history.error && <p role="alert" style={{ color: "var(--danger)", marginTop: 12 }}>{history.error}</p>}
        {assignment.error && <p role="alert" style={{ color: "var(--danger)", marginTop: 12 }}>{assignment.error}</p>}
      </Card>
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>Current status</strong>
          <Badge status={currentStatus === "checked-in" ? "success" : currentStatus === "checked-out" ? "info" : "warning"}>
            {currentStatus === "none" ? "No activity" : currentStatus}
          </Badge>
        </div>
        <h3 className="section-title">Recent gate activity</h3>
        {history.loading && <p className="muted">Loading activity…</p>}
        {!history.loading && !history.data?.length && <p className="muted">No check-in records yet.</p>}
        {history.data?.map((event) => (
          <p key={event.id} className="muted" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            {new Date(event.eventAt).toLocaleString()} · {event.action} · {event.gate}
          </p>
        ))}
      </Card>
    </div>
  );
}
