"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { getUsers, saveUsers } from "@/lib/db";
import { User } from "@/lib/types";

export default function AdminMembersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [members, setMembers] = useState<User[]>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    } else if (user && user.role === "admin") {
      loadMembers();
    }
  }, [user, loading, router]);

  const loadMembers = () => {
    const allUsers = getUsers();
    setMembers(allUsers.filter((u) => u.role === "member"));
  };

  const handleApprove = (memberId: string) => {
    const allUsers = getUsers();
    const updatedUsers = allUsers.map((m) =>
      m.id === memberId ? { ...m, approved: true } : m
    );
    saveUsers(updatedUsers);
    loadMembers();
  };

  const handleReject = (memberId: string) => {
    const allUsers = getUsers();
    const updatedUsers = allUsers.filter((m) => m.id !== memberId);
    saveUsers(updatedUsers);
    loadMembers();
  };

  if (loading) {
    return <p className="text-center mt-8 text-gray-500">Memuat...</p>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="max-w-4xl w-full">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">Kelola Anggota</h1>
          <p className="mt-1 text-sm text-gray-500">
            {members.length} anggota terdaftar
          </p>
        </div>

        <div className="p-8">
          {members.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada anggota terdaftar.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 text-sm text-gray-900">{member.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{member.username}</td>
                      <td className="px-4 py-4">
                        {member.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Disetujui
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Menunggu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          {!member.approved && (
                            <button
                              onClick={() => handleApprove(member.id)}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                            >
                              Setujui
                            </button>
                          )}
                          <button
                            onClick={() => handleReject(member.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                          >
                            Hapus
                          </button>
                        </div>
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
