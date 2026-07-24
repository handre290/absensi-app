"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { addAttendance, getTodayAttendance, getUserAttendance } from "@/lib/db";
import { Attendance } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasAttendedToday, setHasAttendedToday] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user && user.role !== "member") {
      router.push("/admin");
    } else if (user) {
      checkTodayAttendance(user.id);
      loadAttendanceRecords(user.id);
    }
  }, [user, loading, router]);

  const checkTodayAttendance = async (userId: string) => {
    const result = await getTodayAttendance(userId);
    setHasAttendedToday(!!result);
  };

  const loadAttendanceRecords = async (userId: string) => {
    const records = await getUserAttendance(userId);
    setAttendanceRecords(records);
  };

  const handleAttend = async () => {
    if (user) {
      const now = new Date();
      await addAttendance({
        userId: user.id,
        date: now.toISOString().split("T")[0],
        timestamp: now.toTimeString().split(" ")[0].substring(0, 8),
        status: "hadir",
      });
      setHasAttendedToday(true);
      loadAttendanceRecords(user.id);
    }
  };

  if (loading) {
    return <p className="text-center mt-8 text-gray-500">Memuat...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl w-full space-y-8">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-600">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Selamat datang, {user.name}
            </h1>
            <p className="text-gray-500">Dashboard Anggota</p>
          </div>
        </div>
      </div>

      {/* Attendance Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Absensi Hari Ini</h2>
            <p className="mt-1 text-sm text-gray-500">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          {hasAttendedToday ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-700">Sudah absen</span>
            </div>
          ) : (
            <button
              onClick={handleAttend}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
            >
              Absen Sekarang
            </button>
          )}
        </div>
      </div>

      {/* History Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Riwayat Absensi</h2>
        </div>
        <div className="p-8">
          {attendanceRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada riwayat absensi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendanceRecords
                    .sort((a, b) => new Date(b.date + " " + b.timestamp).getTime() - new Date(a.date + " " + a.timestamp).getTime())
                    .map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4 text-sm text-gray-900">{record.date}</td>
                        <td className="px-4 py-4 text-sm text-gray-500">{record.timestamp}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
