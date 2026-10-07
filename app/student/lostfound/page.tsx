"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { apiRequest } from "@/lib/api";
import { useApiResource } from "@/components/hostel/useApiResource";
import { readImage } from "@/components/hostel/readImage";
import Image from "next/image";

type ListedItem = {
  item: {
    id: string; type: "lost" | "found"; title: string; description: string;
    location: string; photo: string | null; status: string; reportedAt: string;
  };
  reporterName: string;
  isOwner: boolean;
};

export default function LostFoundPage() {
  const { data: entries, loading, error, setError, refresh } = useApiResource<ListedItem[]>("/api/hostel/lost-found");
  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const photoData = photo ? await readImage(photo) : undefined;
      await apiRequest("/api/hostel/lost-found", {
        method: "POST", body: JSON.stringify({ type, title, description, location, photo: photoData }),
      });
      setTitle(""); setDescription(""); setLocation(""); setPhoto(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit your item.");
    } finally { setSaving(false); }
  }

  async function claim(id: string) {
    setError("");
    try {
      await apiRequest("/api/hostel/lost-found", {
        method: "PATCH", body: JSON.stringify({ id, status: "claimed" }),
      });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to claim this item.");
    }
  }

  return (
    <div className="grid">
      <Card>
        <h2 className="section-title" style={{ marginTop: 0 }}>Report a lost or found item</h2>
        <form onSubmit={(event) => void submit(event)} style={{ display: "grid", gap: 10 }}>
          <select className="input" value={type} onChange={(event) => setType(event.target.value as "lost" | "found")}>
            <option value="lost">I lost an item</option><option value="found">I found an item</option>
          </select>
          <Input placeholder="Item name" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={250} />
          <textarea className="input" placeholder="Description / identifying details" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} required maxLength={3000} />
          <Input placeholder="Where it was lost or found" value={location} onChange={(event) => setLocation(event.target.value)} required maxLength={250} />
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} />
          {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
          <Button type="submit" disabled={saving}>{saving ? "Submitting…" : "Submit item"}</Button>
        </form>
      </Card>
      <h2 className="section-title">Community listings</h2>
      {loading && <p className="muted">Loading items…</p>}
      {!loading && !entries?.length && <p className="muted">No lost or found items have been reported.</p>}
      {entries?.map(({ item, reporterName, isOwner }) => (
        <Card key={item.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <strong>{item.title}</strong>
            <Badge status={item.status === "open" ? "warning" : "success"}>{item.type} · {item.status}</Badge>
          </div>
          <p className="muted" style={{ marginTop: 6 }}>{item.description}</p>
          <p className="muted">{item.location} · Reported by {reporterName} · {new Date(item.reportedAt).toLocaleDateString()}</p>
          {item.photo && (
            <Image unoptimized width={640} height={360} src={item.photo} alt={item.title} style={{ marginTop: 10, width: "100%", height: "auto", maxHeight: 220, objectFit: "contain", borderRadius: 8 }} />
          )}
          {item.type === "found" && item.status === "open" && !isOwner && <Button variant="ghost" style={{ marginTop: 10 }} onClick={() => void claim(item.id)}>Claim this item</Button>}
        </Card>
      ))}
    </div>
  );
}
