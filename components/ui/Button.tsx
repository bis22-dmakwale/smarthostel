// components/ui/Button.tsx
import { ReactNode } from "react";
import styles from "./ui.module.css";

export default function Button({ children, variant = "primary", ...props }:
  { children: ReactNode; variant?: "primary" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`${styles.btn} ${styles[variant]}`} {...props}>{children}</button>;
}