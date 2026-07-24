import { User, Attendance } from "./types";

const USERS_KEY = "absensi_users";
const ATTENDANCE_KEY = "absensi_attendance";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Users ──

export function getUsers(): User[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    // seed admin default
    const seed: User[] = [
      {
        id: genId(),
        username: "admin",
        password: "admin123",
        name: "Administrator",
        role: "admin",
        approved: true,
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(raw);
}

export function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ── Attendance ──

export function getAttendance(): Attendance[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(ATTENDANCE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveAttendance(records: Attendance[]) {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
}

export function addAttendance(record: Omit<Attendance, "id">): Attendance {
  const all = getAttendance();
  const newRecord: Attendance = { ...record, id: genId() };
  all.push(newRecord);
  saveAttendance(all);
  return newRecord;
}

export function getUserAttendance(userId: string): Attendance[] {
  return getAttendance().filter((a) => a.userId === userId);
}

export function getTodayAttendance(userId: string): Attendance | undefined {
  const today = new Date().toISOString().split("T")[0];
  return getAttendance().find(
    (a) => a.userId === userId && a.date === today
  );
}
