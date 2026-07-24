export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: "admin" | "member";
  approved: boolean;
  createdAt: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // HH:mm:ss
  status: "hadir";
}
