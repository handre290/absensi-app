import { User } from "./types";
import { login as dbLogin, register as dbRegister } from "./db";

const SESSION_KEY = "absensi_session";

// ── Session ──

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// ── Login ──

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const result = await dbLogin(username, password);
  if (result.success && result.user) {
    setSession(result.user);
  }
  return result;
}

// ── Register ──

export async function register(
  name: string,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  return await dbRegister(name, username, password);
}
