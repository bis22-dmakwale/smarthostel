"use client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useApiResource } from "@/components/hostel/useApiResource";
import Image from "next/image";

type Inspection = {
  inspection: { id: string; type: string; hostel: string; room: string; notes: string; photos: string[]; submittedAt: string };
  studentName: string; regNo: string | null;
};

export default function InspectionsPage() {
  const { data: items, loading, error } = useApiResource<Inspection[]>("/api/hostel/inspections");
  return (
    <div className="grid">
      <p className="muted">Submitted student room condition records and photo evidence.</p>
      {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
      {loading && <p className="muted">Loading inspection records…</p>}
      {!loading && !items?.length && !error && <Card><p className="muted">No inspection records submitted yet.</p></Card>}
      {items?.map(({ inspection, studentName, regNo }) => (
        <Card key={inspection.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <div><strong>{studentName}</strong><div className="muted">{regNo ?? "No registration number"}</div></div>
            <Badge status="info">{inspection.type} · {new Date(inspection.submittedAt).toLocaleDateString()}</Badge>
          </div>
          <p className="muted">{inspection.hostel} · {inspection.room}</p>
          <p style={{ margin: "10px 0" }}>{inspection.notes}</p>
          <div className="grid grid-2">
            {inspection.photos.map((photo, index) => (
              <Image key={`${inspection.id}-${index}`} unoptimized width={640} height={360} src={photo} alt={`${studentName} room inspection photo ${index + 1}`} style={{ width: "100%", height: "auto", maxHeight: 260, objectFit: "contain", borderRadius: 8 }} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
