import { supabase } from "./supabase";
import { User, Attendance } from "./types";

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
  // noop — update via Supabase directly
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

// ── Photo Upload ──

export async function uploadPhoto(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("attendance-photos")
    .upload(fileName, file, { contentType: file.type });

  if (error) {
    console.error("Upload photo error:", error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from("attendance-photos")
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// ── Attendance ──

function mapAttendance(a: any): Attendance {
  return {
    id: a.id,
    userId: a.user_id,
    date: a.date,
    timestamp: a.timestamp,
    status: a.status,
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    photo_url: a.photo_url ?? null,
  };
}

export async function getAttendance(): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .order("date", { ascending: false })
    .order("timestamp", { ascending: false });

  if (error) return [];
  return data.map(mapAttendance);
}

export async function getUserAttendance(userId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("timestamp", { ascending: false });

  if (error) return [];
  return data.map(mapAttendance);
}

export async function getTodayAttendance(userId: string): Promise<Attendance | undefined> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (error || !data) return undefined;
  return mapAttendance(data);
}

export async function addAttendance(record: {
  userId: string;
  date: string;
  timestamp: string;
  status: string;
  latitude?: number | null;
  longitude?: number | null;
  photo_url?: string | null;
}): Promise<void> {
  const { error } = await supabase.from("attendance").insert({
    user_id: record.userId,
    date: record.date,
    timestamp: record.timestamp,
    status: record.status,
    latitude: record.latitude ?? null,
    longitude: record.longitude ?? null,
    photo_url: record.photo_url ?? null,
  });

  if (error) throw new Error(error.message);
}
