import { supabase } from "./supabase";
import { User } from "./types";

// ── Login ──

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    return { success: false, error: "Username atau password salah" };
  }

  if (data.password !== password) {
    return { success: false, error: "Username atau password salah" };
  }

  if (!data.approved) {
    return { success: false, error: "Akun belum disetujui admin" };
  }

  const user: User = {
    id: data.id,
    username: data.username,
    password: data.password,
    name: data.name,
    role: data.role,
    approved: data.approved,
    createdAt: data.created_at,
  };

  return { success: true, user };
}

// ── Register ──

export async function register(
  name: string,
  username: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  // Cek duplikat
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "Username sudah digunakan" };
  }

  const { error } = await supabase.from("users").insert({
    username,
    password,
    name,
    role: "member",
    approved: false,
  });

  if (error) {
    return { success: false, error: "Gagal mendaftar: " + error.message };
  }

  return { success: true };
}

// ── Get Users ──

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return [];
  return data.map((u: any) => ({
    id: u.id,
    username: u.username,
    password: u.password,
    name: u.name,
    role: u.role,
    approved: u.approved,
    createdAt: u.created_at,
  }));
}

export async function saveUsers(_users: User[]) {
  // Tidak perlu implementasi karena update via Supabase langsung
}

// ── Update User ──

export async function updateUser(
  id: string,
  updates: Partial<{ approved: boolean }>
): Promise<void> {
  await supabase.from("users").update(updates).eq("id", id);
}

// ── Delete User ──

export async function deleteUser(id: string): Promise<void> {
  await supabase.from("users").delete().eq("id", id);
}

// ── Attendance ──

export async function getAttendance(): Promise<any[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .order("date", { ascending: false })
    .order("timestamp", { ascending: false });

  if (error) return [];
  return data.map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    date: a.date,
    timestamp: a.timestamp,
    status: a.status,
  }));
}

export async function getUserAttendance(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("timestamp", { ascending: false });

  if (error) return [];
  return data.map((a: any) => ({
    id: a.id,
    userId: a.user_id,
    date: a.date,
    timestamp: a.timestamp,
    status: a.status,
  }));
}

export async function getTodayAttendance(userId: string): Promise<any | undefined> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (error || !data) return undefined;
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    timestamp: data.timestamp,
    status: data.status,
  };
}

export async function addAttendance(record: {
  userId: string;
  date: string;
  timestamp: string;
  status: string;
}): Promise<any> {
  const { error } = await supabase.from("attendance").insert({
    user_id: record.userId,
    date: record.date,
    timestamp: record.timestamp,
    status: record.status,
  });

  if (error) throw new Error(error.message);
}
