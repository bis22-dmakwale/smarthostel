"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { apiRequest } from "@/lib/api";

type Credential = { name: string; email: string; regNo: string; hostel: string; room: string; password: string };

export default function CredentialsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [regNo, setRegNo] = useState("");
  const [hostel, setHostel] = useState("");
  const [room, setRoom] = useState("");
  const [credential, setCredential] = useState<Credential | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function issue(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setCredential(null);
    try {
      setCredential(await apiRequest<Credential>("/api/admin/credentials", {
        method: "POST", body: JSON.stringify({ name, email, regNo, hostel, room }),
      }));
      setName(""); setEmail(""); setRegNo(""); setHostel(""); setRoom("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to issue credentials.");
    } finally { setSaving(false); }
  }

  return (
    <div className="grid">
      <Card>
        <h2 className="section-title" style={{ marginTop: 0 }}>Issue student login</h2>
        <p className="muted" style={{ marginBottom: 10 }}>A temporary password is generated and displayed once. Share it securely with the student.</p>
        <form onSubmit={(event) => void issue(event)} style={{ display: "grid", gap: 10 }}>
          <Input placeholder="Student full name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={200} />
          <Input type="email" placeholder="University email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input placeholder="Registration number" value={regNo} onChange={(event) => setRegNo(event.target.value)} required maxLength={60} />
          <div className="grid grid-2">
            <Input placeholder="Hostel" value={hostel} onChange={(event) => setHostel(event.target.value)} required maxLength={150} />
            <Input placeholder="Room" value={room} onChange={(event) => setRoom(event.target.value)} required maxLength={40} />
          </div>
          {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
          <Button type="submit" disabled={saving}>{saving ? "Issuing…" : "Generate and issue credentials"}</Button>
        </form>
      </Card>
      {credential && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between" }}><strong>{credential.name}</strong><Badge status="success">Account created</Badge></div>
          <p className="muted">{credential.regNo} · {credential.email}</p>
          <p className="muted">{credential.hostel} · {credential.room}</p>
          <p style={{ fontFamily: "monospace", marginTop: 8 }}>Temporary password: <strong>{credential.password}</strong></p>
        </Card>
      )}
    </div>
  );
}
