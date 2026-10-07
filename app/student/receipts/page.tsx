"use client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useApiResource } from "@/components/hostel/useApiResource";
import { mkw } from "@/lib/format";

type Receipt = { id: string; trackingNo: string; amount: number; method: string; paidAt: string; status: string };

export default function ReceiptsPage() {
  const { data: items, loading, error } = useApiResource<Receipt[]>("/api/hostel/receipts");
  return (
    <div className="grid">
      <p className="muted">Receipts issued by the hostel office have unique tracking numbers for verification.</p>
      {loading && <p className="muted">Loading receipts…</p>}
      {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
      {!loading && !error && !items?.length && <Card><p className="muted">No receipts have been issued to your account.</p></Card>}
      {items?.map((receipt) => (
        <Card key={receipt.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{mkw(receipt.amount)}</div>
              <div className="muted">{receipt.method} · {new Date(receipt.paidAt).toLocaleDateString()}</div>
            </div>
            <Badge status={receipt.status === "verified" ? "success" : "warning"}>{receipt.status}</Badge>
          </div>
          <div style={{
            marginTop: 12, background: "var(--primary-light)", borderRadius: 8,
            padding: "8px 12px", fontFamily: "monospace", fontSize: ".85rem",
            display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap",
          }}>
            <span>{receipt.trackingNo}</span><span style={{ color: "var(--primary)", fontWeight: 700 }}>✓ Verifiable</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
