-- Create storage bucket for learning aid images
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-aids', 'learning-aids', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for learning-aids bucket

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'learning-aids');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'learning-aids' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'learning-aids' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'learning-aids' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
