"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { apiRequest } from "@/lib/api";
import { useApiResource } from "@/components/hostel/useApiResource";
import { mkw } from "@/lib/format";

type Student = { id: string; name: string; email: string; regNo: string | null };
type Receipt = { receipt: { id: string; trackingNo: string; amount: number; method: string; paidAt: string; status: string }; studentName: string; regNo: string | null };

export default function AdminReceiptsPage() {
  const students = useApiResource<Student[]>("/api/admin/credentials");
  const receipts = useApiResource<Receipt[]>("/api/hostel/receipts");
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Airtel Money");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function issue(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      await apiRequest("/api/hostel/receipts", {
        method: "POST", body: JSON.stringify({ studentId, amount: Number(amount), method }),
      });
      setStudentId(""); setAmount("");
      await receipts.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to issue receipt.");
    } finally { setSaving(false); }
  }

  return (
    <div className="grid">
      <Card>
        <h2 className="section-title" style={{ marginTop: 0 }}>Generate payment receipt</h2>
        <form onSubmit={(event) => void issue(event)} style={{ display: "grid", gap: 10 }}>
          <select className="input" value={studentId} onChange={(event) => setStudentId(event.target.value)} required>
            <option value="">Select student</option>
            {students.data?.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.regNo}</option>)}
          </select>
          <input className="input" type="number" min="1" step="1" placeholder="Amount (MWK)" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          <select className="input" value={method} onChange={(event) => setMethod(event.target.value)}>
            {["Airtel Money", "TNM Mpamba", "Bank", "Cash"].map((option) => <option key={option}>{option}</option>)}
          </select>
          {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
          <Button type="submit" disabled={saving}>{saving ? "Generating…" : "Generate verified receipt"}</Button>
        </form>
      </Card>
      <h2 className="section-title">Issued receipts</h2>
      {receipts.error && <p role="alert" style={{ color: "var(--danger)" }}>{receipts.error}</p>}
      {receipts.data?.map(({ receipt, studentName, regNo }) => (
        <Card key={receipt.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div><strong>{studentName}</strong><p className="muted">{regNo}</p></div>
            <Badge status="success">{mkw(receipt.amount)}</Badge>
          </div>
          <p className="muted">{receipt.method} · {new Date(receipt.paidAt).toLocaleDateString()}</p>
          <p style={{ fontFamily: "monospace", marginTop: 6 }}>{receipt.trackingNo}</p>
        </Card>
      ))}
      {!receipts.loading && !receipts.data?.length && <p className="muted">No receipts have been issued yet.</p>}
    </div>
  );
}
