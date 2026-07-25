"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { getAttendance, getUsers } from "@/lib/db";
import { Attendance, User } from "@/lib/types";
import * as XLSX from "xlsx";
import { useState } from "react";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    } else if (user && user.role === "admin") {
      loadData();
    }
  }, [user, loading, router]);

  const loadData = async () => {
    setAllAttendance(await getAttendance());
    setAllUsers(await getUsers());
  };

  const getMemberName = (userId: string) => {
    const member = allUsers.find((u) => u.id === userId);
    return member ? member.name : "N/A";
  };

  const getMemberUsername = (userId: string) => {
    const member = allUsers.find((u) => u.id === userId);
    return member ? member.username : "N/A";
  };

  const filteredAttendance = allAttendance.filter((record) => {
    if (!filterDate) return true;
    return record.date === filterDate;
  });

  const exportToExcel = async () => {
    const ExcelJS = (await import("exceljs")).default;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Data Absensi");

    // Columns
    ws.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Anggota", key: "nama", width: 22 },
      { header: "Username", key: "username", width: 16 },
      { header: "Tanggal", key: "tanggal", width: 14 },
      { header: "Waktu Absen", key: "waktu", width: 14 },
      { header: "Koordinat", key: "koordinat", width: 22 },
      { header: "Foto", key: "foto", width: 14 },
      { header: "Status", key: "status", width: 10 },
    ];

    // Header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Rows
    for (let i = 0; i < filteredAttendance.length; i++) {
      const record = filteredAttendance[i];
      ws.addRow({
        no: i + 1,
        nama: getMemberName(record.userId),
        username: getMemberUsername(record.userId),
        tanggal: record.date,
        waktu: record.timestamp,
        koordinat: record.latitude && record.longitude
          ? `${record.latitude}, ${record.longitude}`
          : "-",
        foto: record.photo_url ? "Ada" : "-",
        status: record.status,
      });
    }

    // Cell styles
    ws.eachRow((row, rowNum) => {
      row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Data_Absensi.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p className="text-center mt-8 text-gray-500">Memuat...</p>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="max-w-6xl w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
          <p className="mt-1 text-sm text-gray-600 font-medium">Kelola absensi anggota</p>
        </div>
        <Link
          href="/admin/members"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
        >
          Kelola Anggota
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Total Anggota</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {allUsers.filter((u) => u.role === "member").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Absensi Hari Ini</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {allAttendance.filter(
                  (a) => a.date === new Date().toISOString().split("T")[0]
                ).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Menunggu Persetujuan</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {allUsers.filter((u) => u.role === "member" && !u.approved).length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Data */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900">Rekap Absensi</h2>
            <div className="flex items-center space-x-3">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="block px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  Reset
                </button>
              )}
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Expor Excel
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {filteredAttendance.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada data absensi.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Foto</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAttendance.map((record, index) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 text-sm text-gray-500">{index + 1}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{getMemberName(record.userId)}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{getMemberUsername(record.userId)}</td>
                      <td className="px-4 py-4 text-sm text-gray-700">{record.date}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{record.timestamp}</td>
                      <td className="px-4 py-4 text-sm">
                        {record.latitude && record.longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 underline"
                          >
                            {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {record.photo_url ? (
                          <a href={record.photo_url} target="_blank" rel="noopener noreferrer">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={record.photo_url}
                              alt="foto absen"
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition"
                            />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
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
