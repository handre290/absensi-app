-- ============================================================
-- Schema untuk Absensi App (Supabase PostgreSQL)
-- ============================================================

-- 1. Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  timestamp TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'hadir' CHECK (status IN ('hadir')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index biar cepet
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_users_username ON users(username);

-- 3. Seed admin default
-- Password: admin123 (hash akan di-handle oleh aplikasi, tapi untuk seed awal
-- kita pakai plain text dulu — aplikasi akan menggunakan bcrypt atau similar)
-- NOTE: Untuk keamanan di produksi, hash password pakai fungsi pgcrypto.
INSERT INTO users (username, password, name, role, approved)
VALUES ('admin', 'admin123', 'Administrator', 'admin', TRUE);
