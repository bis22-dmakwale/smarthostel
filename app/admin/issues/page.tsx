"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useApiResource } from "@/components/hostel/useApiResource";
import { apiRequest } from "@/lib/api";
import { useState } from "react";

type MaintenanceItem = { id: string; title: string; description: string; hostel: string; room: string; status: string; votes: number; verificationNotes: string | null };
type Transfer = { transfer: { id: string; requestedHostel: string; requestedRoom: string; reason: string; status: string; reviewNotes: string | null }; studentName: string; regNo: string | null };
type Complaint = { id: string; location: string; message: string; status: string; submittedAt: string };

export default function IssuesPage() {
  const [verificationNotes, setVerificationNotes] = useState<Record<string, string>>({});
  const [transferNotes, setTransferNotes] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");
  const maintenance = useApiResource<MaintenanceItem[]>("/api/hostel/maintenance");
  const transfers = useApiResource<Transfer[]>("/api/hostel/transfers");
  const complaints = useApiResource<Complaint[]>("/api/hostel/noise");

  async function update(resource: string, id: string, values: Record<string, string>) {
    setActionError("");
    try {
      await apiRequest(`/api/hostel/${resource}`, { method: "PATCH", body: JSON.stringify({ id, ...values }) });
      await Promise.all([maintenance.refresh(), transfers.refresh(), complaints.refresh()]);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to update this record.";
      setActionError(message);
    }
  }

  return (
    <div className="grid">
      {actionError && <p role="alert" style={{ color: "var(--danger)" }}>{actionError}</p>}
      <h2 className="section-title">Maintenance verification</h2>
      {maintenance.error && <p role="alert" style={{ color: "var(--danger)" }}>{maintenance.error}</p>}
      {maintenance.data?.map((item) => (
        <Card key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong>{item.title}</strong><Badge status={item.status === "fixed" ? "success" : item.status === "open" ? "warning" : "info"}>{item.status}</Badge>
          </div>
          <p className="muted">{item.hostel} · {item.room} · {item.votes} votes</p>
          {item.description && <p style={{ marginTop: 6 }}>{item.description}</p>}
          {item.verificationNotes && <p className="muted" style={{ marginTop: 6 }}>Verification: {item.verificationNotes}</p>}
          <textarea className="input" aria-label={`Verification notes for ${item.title}`} placeholder="Verification notes (optional)" value={verificationNotes[item.id] ?? ""} onChange={(event) => setVerificationNotes((notes) => ({ ...notes, [item.id]: event.target.value }))} rows={2} maxLength={2000} style={{ marginTop: 10 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {(["open", "in-progress", "fixed"] as const).map((status) => (
              <Button key={status} variant={item.status === status ? "primary" : "ghost"} onClick={() => void update("maintenance", item.id, { status, notes: verificationNotes[item.id] ?? "" })}>{status}</Button>
            ))}
          </div>
        </Card>
      ))}
      {!maintenance.loading && !maintenance.data?.length && <p className="muted">No maintenance reports.</p>}

      <h2 className="section-title">Room transfer requests</h2>
      {transfers.error && <p role="alert" style={{ color: "var(--danger)" }}>{transfers.error}</p>}
      {transfers.data?.map(({ transfer, studentName, regNo }) => (
        <Card key={transfer.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div><strong>{studentName}</strong><p className="muted">{regNo} · Requested {transfer.requestedHostel} · {transfer.requestedRoom}</p></div><Badge status={transfer.status === "approved" ? "success" : transfer.status === "rejected" ? "danger" : "warning"}>{transfer.status}</Badge>
          </div>
          <p className="muted">{transfer.reason}</p>
          {(transfer.reviewNotes || transferNotes[transfer.id]) && <p className="muted">Office note: {transfer.reviewNotes || transferNotes[transfer.id]}</p>}
          {transfer.status === "pending" && <textarea className="input" aria-label={`Review notes for ${studentName}`} placeholder="Review notes (optional)" value={transferNotes[transfer.id] ?? ""} onChange={(event) => setTransferNotes((notes) => ({ ...notes, [transfer.id]: event.target.value }))} rows={2} maxLength={2000} style={{ marginTop: 8 }} />}
          {transfer.status === "pending" && <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <Button onClick={() => void update("transfers", transfer.id, { status: "approved", notes: transferNotes[transfer.id] ?? "" })}>Approve</Button>
            <Button variant="danger" onClick={() => void update("transfers", transfer.id, { status: "rejected", notes: transferNotes[transfer.id] ?? "" })}>Reject</Button>
          </div>}
        </Card>
      ))}
      {!transfers.loading && !transfers.data?.length && <p className="muted">No transfer requests.</p>}

      <h2 className="section-title">Anonymous noise complaints</h2>
      {complaints.error && <p role="alert" style={{ color: "var(--danger)" }}>{complaints.error}</p>}
      {complaints.data?.map((complaint) => (
        <Card key={complaint.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <strong>{complaint.location}</strong><Badge status={complaint.status === "resolved" ? "success" : complaint.status === "reviewed" ? "info" : "warning"}>{complaint.status}</Badge>
          </div>
          <p style={{ marginTop: 8 }}>{complaint.message}</p>
          <p className="muted">{new Date(complaint.submittedAt).toLocaleString()} · Anonymous</p>
          {complaint.status === "open" && <Button variant="ghost" style={{ marginTop: 8 }} onClick={() => void update("noise", complaint.id, { status: "reviewed" })}>Mark reviewed</Button>}
          {complaint.status !== "resolved" && <Button variant="ghost" style={{ marginTop: 8, marginLeft: 8 }} onClick={() => void update("noise", complaint.id, { status: "resolved" })}>Resolve</Button>}
        </Card>
      ))}
      {!complaints.loading && !complaints.data?.length && <p className="muted">No anonymous complaints received.</p>}
    </div>
  );
}
