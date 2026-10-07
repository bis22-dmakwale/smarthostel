"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useApiResource } from "@/components/hostel/useApiResource";
import { apiRequest } from "@/lib/api";

type Transfer = {
  id: string; currentHostel: string; currentRoom: string;
  requestedHostel: string; requestedRoom: string; reason: string; status: string; reviewNotes: string | null;
};

export default function TransferPage() {
  const { data: items, loading, error, setError, refresh } = useApiResource<Transfer[]>("/api/hostel/transfers");
  const [requestedHostel, setRequestedHostel] = useState("");
  const [requestedRoom, setRequestedRoom] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/api/hostel/transfers", {
        method: "POST", body: JSON.stringify({ requestedHostel, requestedRoom, reason }),
      });
      setRequestedHostel(""); setRequestedRoom(""); setReason("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit the request.");
    } finally { setSaving(false); }
  }

  return (
    <div className="grid">
      <Card>
        <h2 className="section-title" style={{ marginTop: 0 }}>Request a room transfer</h2>
        <p className="muted" style={{ marginBottom: 10 }}>Transfer requests are reviewed by the hostel office. An approved request updates your room assignment.</p>
        <form onSubmit={(event) => void submit(event)} style={{ display: "grid", gap: 10 }}>
          <Input placeholder="Requested hostel" value={requestedHostel} onChange={(event) => setRequestedHostel(event.target.value)} required maxLength={150} />
          <Input placeholder="Requested room" value={requestedRoom} onChange={(event) => setRequestedRoom(event.target.value)} required maxLength={40} />
          <textarea className="input" placeholder="Reason for transfer" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} required maxLength={3000} />
          <Button type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit transfer request"}</Button>
        </form>
      </Card>
      {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
      <h2 className="section-title">Your requests</h2>
      {loading && <p className="muted">Loading requests…</p>}
      {!loading && !items?.length && <p className="muted">You have not requested a transfer.</p>}
      {items?.map((item) => (
        <Card key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <strong>{item.currentHostel} {item.currentRoom} → {item.requestedHostel} {item.requestedRoom}</strong>
            <Badge status={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "warning"}>{item.status}</Badge>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>{item.reason}</p>
          {item.reviewNotes && <p className="muted" style={{ marginTop: 6 }}>Office note: {item.reviewNotes}</p>}
        </Card>
      ))}
    </div>
  );
}
