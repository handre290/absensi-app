# Absensi App - Project Context

## Project
Aplikasi absensi anggota berbasis Next.js + Supabase.
Lokasi: `C:\Users\ANDRE\absensi-app`

## Tech Stack
- Next.js 16 (App Router, Turbopack)
- Tailwind CSS v4
- Supabase (PostgreSQL, RLS)
- TypeScript

## Struktur
- `app/login/page.tsx` - Halaman login
- `app/register/page.tsx` - Halaman registrasi
- `app/dashboard/page.tsx` - Dashboard anggota (absen)
- `app/admin/page.tsx` - Dashboard admin (rekap + export Excel)
- `app/admin/members/page.tsx` - Kelola anggota (approve/reject)
- `components/Sidebar.tsx` - Sidebar menu (profil, tema, bahasa)
- `components/Navbar.tsx` - Navbar utama
- `components/AuthProvider.tsx` - Context auth
- `lib/AppContext.tsx` - Context app (tema, bahasa, profil)
- `lib/auth.ts` - Auth helpers (async via Supabase)
- `lib/db.ts` - Database functions (Supabase)
- `lib/translations.ts` - Multi-language (ID/EN/JP)
- `lib/supabase.ts` - Supabase client

## Status
Aplikasi sudah berfungsi penuh dengan:
- Login/Register dengan Supabase
- Absensi harian (per user, 1x/hari)
- Admin approve/reject anggota
- Rekap absensi + export Excel
- Sidebar menu (profil, dark/light mode, bahasa ID/EN/JP)
- Deployed di Vercel

## Environment Variables (.env.local)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Supabase
- Project URL: https://agywqjihvqsoopfwcdjc.supabase.co
- Tables: users, attendance (sudah create + RLS policy)
- Anon key: sudah di .env.local

## Credentials
- Admin: username `admin`, password `admin123`
