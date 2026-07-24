import { User } from "./types";
import { getUsers, saveUsers } from "./db";

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

export function login(
  username: string,
  password: string
): { success: boolean; error?: string; user?: User } {
  const users = getUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) return { success: false, error: "Username atau password salah" };
  if (!user.approved)
    return { success: false, error: "Akun belum disetujui admin" };
  setSession(user);
  return { success: true, user };
}

// ── Register ──

export function register(
  name: string,
  username: string,
  password: string
): { success: boolean; error?: string } {
  const users = getUsers();
  if (users.some((u) => u.username === username)) {
    return { success: false, error: "Username sudah digunakan" };
  }
  const newUser: User = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    username,
    password,
    name,
    role: "member",
    approved: false,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);
  return { success: true };
}
