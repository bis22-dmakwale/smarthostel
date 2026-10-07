import {
  ArrowLeftRight,
  ClipboardCheck,
  House,
  KeyRound,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  ScanLine,
  UsersRound,
  VolumeX,
  Wrench,
} from "lucide-react";

export const navIcons = {
  dashboard: LayoutDashboard,
  credentials: KeyRound,
  students: UsersRound,
  inspections: ClipboardCheck,
  issues: Wrench,
  receipts: ReceiptText,
  lostFound: PackageSearch,
  home: House,
  checkin: ScanLine,
  transfer: ArrowLeftRight,
  noise: VolumeX,
} as const;

export type NavIcon = keyof typeof navIcons;
export interface NavItem { href: string; label: string; icon: NavIcon; }
