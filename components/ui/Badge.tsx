// components/ui/Badge.tsx
export default function Badge({ status, children }: { status: "success" | "warning" | "danger" | "info" | "neutral"; children: React.ReactNode }) {
  return <span className="badge" data-status={status}>{children}</span>;
}