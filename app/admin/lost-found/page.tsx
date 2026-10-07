"use client";
import Image from "next/image";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { apiRequest } from "@/lib/api";
import { useApiResource } from "@/components/hostel/useApiResource";

type Item = {
  item: {
    id: string; type: "lost" | "found"; title: string; description: string;
    location: string; photo: string | null; status: string; reportedAt: string;
  };
  reporterName: string;
};

export default function AdminLostFoundPage() {
  const { data: entries, loading, error, setError, refresh } = useApiResource<Item[]>("/api/hostel/lost-found");
  const [savingId, setSavingId] = useState("");

  async function markReturned(id: string) {
    setSavingId(id); setError("");
    try {
      await apiRequest("/api/hostel/lost-found", {
        method: "PATCH", body: JSON.stringify({ id, status: "returned" }),
      });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update the item.");
    } finally { setSavingId(""); }
  }

  return (
    <div className="grid">
      <p className="muted">Review student reports, track claims, and close the loop when an item is returned.</p>
      {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
      {loading && <p className="muted">Loading item reports…</p>}
      {!loading && !entries?.length && !error && <Card><p className="muted">No lost or found items have been reported.</p></Card>}
      {entries?.map(({ item, reporterName }) => (
        <Card key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div><strong>{item.title}</strong><p className="muted">{item.location} · Reported by {reporterName}</p></div>
            <Badge status={item.status === "returned" ? "success" : item.status === "claimed" ? "info" : "warning"}>{item.type} · {item.status}</Badge>
          </div>
          <p style={{ marginTop: 8 }}>{item.description}</p>
          <p className="muted">{new Date(item.reportedAt).toLocaleString()}</p>
          {item.photo && <Image unoptimized width={640} height={360} src={item.photo} alt={item.title} style={{ marginTop: 10, width: "100%", height: "auto", maxHeight: 240, objectFit: "contain", borderRadius: 8 }} />}
          {item.status === "claimed" && <Button style={{ marginTop: 10 }} disabled={savingId === item.id} onClick={() => void markReturned(item.id)}>{savingId === item.id ? "Updating…" : "Mark returned"}</Button>}
        </Card>
      ))}
    </div>
  );
}
