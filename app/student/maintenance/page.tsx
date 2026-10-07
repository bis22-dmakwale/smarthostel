"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { apiRequest } from "@/lib/api";
import { useApiResource } from "@/components/hostel/useApiResource";

type RequestItem = {
  id: string; title: string; description: string; hostel: string; room: string;
  votes: number; votedByMe: boolean; status: "open" | "in-progress" | "fixed";
};

export default function MaintenancePage() {
  const { data: items, loading, error, setError, refresh } = useApiResource<RequestItem[]>("/api/hostel/maintenance");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function report(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await apiRequest("/api/hostel/maintenance", {
        method: "POST", body: JSON.stringify({ title, description }),
      });
      setTitle("");
      setDescription("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit the report.");
    } finally {
      setSaving(false);
    }
  }

  async function vote(id: string) {
    setError("");
    try {
      await apiRequest("/api/hostel/maintenance", {
        method: "PATCH", body: JSON.stringify({ id, action: "vote" }),
      });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update your vote.");
    }
  }

  const badgeStatus = (status: RequestItem["status"]) =>
    status === "open" ? "warning" : status === "in-progress" ? "info" : "success";

  return (
    <div className="grid">
      <Card>
        <h2 className="section-title" style={{ marginTop: 0 }}>Report a maintenance issue</h2>
        <form onSubmit={(event) => void report(event)} style={{ display: "grid", gap: 10 }}>
          <Input placeholder="Issue title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={250} />
          <textarea className="input" placeholder="Details (optional)" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={3000} />
          <Button type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit report"}</Button>
        </form>
        <p className="muted" style={{ marginTop: 10 }}>Issues include your assigned hostel and room. Students can vote to prioritize repairs.</p>
      </Card>
      {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
      {loading && <p className="muted">Loading maintenance requests…</p>}
      {items?.map((item) => (
        <Card key={item.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button aria-label={`${item.votedByMe ? "Remove vote from" : "Vote for"} ${item.title}`} onClick={() => void vote(item.id)} style={{
            border: `2px solid ${item.votedByMe ? "var(--primary)" : "var(--border)"}`,
            background: item.votedByMe ? "var(--primary-light)" : "var(--surface)",
            borderRadius: 12, padding: "8px 12px", textAlign: "center", minWidth: 56,
          }}>
            <div style={{ fontWeight: 800, color: "var(--primary)" }}>{item.votes}</div>
            <div style={{ fontSize: ".65rem", color: "var(--text-muted)" }}>votes</div>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            {item.description && <div className="muted">{item.description}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
              <span className="muted">{item.hostel} · {item.room}</span>
              <Badge status={badgeStatus(item.status)}>{item.status}</Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
