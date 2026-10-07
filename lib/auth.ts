"use client";
import { apiRequest } from "@/lib/api";
import type { User, Role } from "./types";

const KEY = "mubas_hostel_session";
const SESSION_EVENT = "mubas-hostel-session-change";

export function subscribeSession(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SESSION_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SESSION_EVENT, callback);
  };
}

export function sessionSnapshot() {
  return localStorage.getItem(KEY);
}

function notifySessionChanged() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export async function login(email: string, password: string): Promise<User> {
  const user = await apiRequest<User>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem(KEY, JSON.stringify(user));
  notifySessionChanged();
  return user;
}

export function session(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export async function logout() {
  try {
    await apiRequest<{ ok: true }>("/api/auth/logout", { method: "POST" });
  } finally {
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
    if (typeof window !== "undefined") notifySessionChanged();
  }
}

export function homeFor(role: Role) {
  return role === "admin" ? "/admin/dashboard" : "/student/dashboard";
}
