-- Add location & photo columns to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for attendance photos
INSERT INTO storage.buckets (id, name, public) VALUES ('attendance-photos', 'attendance-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to attendance-photos
CREATE POLICY "Anyone can upload attendance photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attendance-photos');

-- Allow public read of attendance photos
CREATE POLICY "Anyone can view attendance photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'attendance-photos');
