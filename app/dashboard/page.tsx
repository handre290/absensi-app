"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { addAttendance, getTodayAttendance, getUserAttendance, uploadPhoto } from "@/lib/db";
import { Attendance } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasAttendedToday, setHasAttendedToday] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

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

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Browser tidak mendukung geolokasi");
      return;
    }
    setLocationLoading(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError("Izinkan akses lokasi di browser untuk melanjutkan");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Lokasi tidak tersedia");
            break;
          case err.TIMEOUT:
            setLocationError("Waktu permintaan lokasi habis");
            break;
          default:
            setLocationError("Gagal mendapatkan lokasi");
        }
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      setCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      // Fallback: file input if camera unavailable
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" });
          setPhotoFile(file);
          setPhotoPreview(URL.createObjectURL(blob));
          stopCamera();
        }
      }, "image/jpeg", 0.8);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const retakePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleAttend = async () => {
    if (!user) return;

    // Auto-get location if not yet acquired
    if (!location) {
      getLocation();
    }

    // Auto-start camera if no photo yet
    if (!photoFile && !cameraActive) {
      startCamera();
    }

    // If still missing location or photo after trigger, wait for user
    if (!location || !photoFile) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const now = new Date();
      let photoUrl: string | null = null;

      // Upload photo first
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
        if (!photoUrl) {
          throw new Error("Gagal mengunggah foto");
        }
      }

      await addAttendance({
        userId: user.id,
        date: now.toISOString().split("T")[0],
        timestamp: now.toTimeString().split(" ")[0].substring(0, 8),
        status: "hadir",
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        photo_url: photoUrl,
      });

      setHasAttendedToday(true);
      setPhotoFile(null);
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhotoPreview(null);
      setLocation(null);
      loadAttendanceRecords(user.id);
    } catch (err: any) {
      setSubmitError(err.message || "Gagal menyimpan absensi");
    } finally {
      setSubmitting(false);
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
        {hasAttendedToday ? (
          <div className="flex items-center space-x-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-green-800">Sudah absen hari ini</p>
              <p className="text-sm text-green-600">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Absensi Hari Ini</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {new Date().toLocaleDateString("id-ID", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Location */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Lokasi</span>
                </div>
                <div>
                  {location ? (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  ) : locationLoading ? (
                    <span className="text-sm text-gray-500">Mendapatkan lokasi...</span>
                  ) : (
                    <button
                      onClick={getLocation}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                    >
                      {locationError ? "Coba lagi" : "Ambil lokasi"}
                    </button>
                  )}
                </div>
              </div>
              {locationError && (
                <p className="mt-2 text-xs text-red-500">{locationError}</p>
              )}
            </div>

            {/* Photo */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Foto</span>
                </div>
                {photoPreview ? (
                  <button
                    onClick={retakePhoto}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                  >
                    Ambil ulang
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    {!cameraActive && (
                      <button
                        onClick={startCamera}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition"
                      >
                        Buka kamera
                      </button>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                    >
                      Pilih file
                    </button>
                  </div>
                )}
              </div>

              {/* Camera preview */}
              {cameraActive && (
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
                  <div className="mt-3 flex justify-center space-x-3">
                    <button
                      onClick={capturePhoto}
                      className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      📸 Ambil foto
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-6 py-2 bg-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-300 transition"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Photo preview */}
              {photoPreview && !cameraActive && (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
                  <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    ✓ Foto siap
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Submit */}
            {submitError && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{submitError}</p>
            )}
            <button
              onClick={handleAttend}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Menyimpan...</span>
                </span>
              ) : (
                "Absen Sekarang"
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Pastikan lokasi aktif dan foto wajah terlihat jelas
            </p>
          </div>
        )}
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lokasi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Foto</th>
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
                        <td className="px-4 py-4 text-sm text-gray-500">
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

      {/* hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
