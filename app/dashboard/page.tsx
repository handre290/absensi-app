"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());

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

      {/* Calendar Card */}
      <CalendarView records={attendanceRecords} />

      {/* hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// ── Calendar Component ──

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function CalendarView({ records }: { records: Attendance[] }) {
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());

  const attendedDates = useMemo(() => {
    const s = new Set<string>();
    records.forEach((r) => s.add(r.date));
    return s;
  }, [records]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const today = new Date().toISOString().split("T")[0];

  const prev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Kalender Absensi</h2>
      </div>
      <div className="p-6">
        {/* nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-base font-semibold text-gray-800">{MONTHS[month]} {year}</span>
          <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        {/* day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
          ))}
        </div>
        {/* calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const attended = attendedDates.has(dateStr);
            const isToday = dateStr === today;
            const isSunday = i % 7 === 0;
            return (
              <div
                key={dateStr}
                className={`relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition
                  ${attended ? "bg-green-100" : "bg-red-50"}
                  ${isSunday ? "text-red-500" : "text-gray-900"}
                  ${isToday ? "ring-2 ring-indigo-400 ring-offset-1" : ""}
                `}
              >
                {day}
                {attended && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
        {/* legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-sm bg-green-100" /> <span>Hadir</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded-sm bg-red-50" /> <span>Belum absen / Tidak hadir</span>
          </span>
        </div>
        {/* detail */}
        {records.length > 0 && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Detail Absensi</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {[...records]
                .sort((a, b) => new Date(b.date + " " + b.timestamp).getTime() - new Date(a.date + " " + a.timestamp).getTime())
                .slice(0, 30)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-gray-700 font-medium shrink-0">{r.date}</span>
                      <span className="text-gray-400 shrink-0">{r.timestamp}</span>
                      {r.latitude && r.longitude && (
                        <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 shrink-0 text-xs">📍</a>
                      )}
                      {r.photo_url && (
                        <a href={r.photo_url} target="_blank" rel="noopener noreferrer">
                          <img src={r.photo_url} alt="" className="w-6 h-6 rounded object-cover" />
                        </a>
                      )}
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">hadir</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
