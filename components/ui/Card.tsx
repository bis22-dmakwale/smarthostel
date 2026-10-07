// components/ui/Card.tsx
import { ReactNode } from "react";
import styles from "./ui.module.css";
export default function Card({ children, className, ...props }: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={[styles.card, className].filter(Boolean).join(" ")} {...props}>{children}</div>;
}