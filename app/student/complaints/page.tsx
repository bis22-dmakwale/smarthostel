"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { apiRequest } from "@/lib/api";

export default function ComplaintsPage() {
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError(""); setSent(false);
    try {
      await apiRequest("/api/hostel/noise", { method: "POST", body: JSON.stringify({ location, message }) });
      setLocation(""); setMessage(""); setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to submit the complaint.");
    } finally { setSaving(false); }
  }

  return (
    <div className="grid">
      <Card>
        <h2 className="section-title" style={{ marginTop: 0 }}>Anonymous noise complaint</h2>
        <p className="muted" style={{ marginBottom: 12 }}>Your account and identity are not recorded with this report. Include enough detail for the hostel office to investigate.</p>
        <form onSubmit={(event) => void submit(event)} style={{ display: "grid", gap: 10 }}>
          <Input placeholder="Hostel, block, or location" value={location} onChange={(event) => setLocation(event.target.value)} required maxLength={250} />
          <textarea className="input" placeholder="Describe the noise concern" value={message} onChange={(event) => setMessage(event.target.value)} rows={5} required maxLength={5000} />
          {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
          {sent && <p role="status" style={{ color: "var(--success)" }}>Your anonymous report has been sent to the hostel office.</p>}
          <Button type="submit" disabled={saving}>{saving ? "Sending…" : "Submit anonymously"}</Button>
        </form>
      </Card>
    </div>
  );
}
