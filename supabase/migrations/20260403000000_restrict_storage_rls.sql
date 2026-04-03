-- Fix: restrict diary-media storage access.
-- Previously: anyone authenticated could view ALL diary-media.
-- Now: users can view media only for diaries they can access (public + own).

-- Drop the overly permissive view policy
DROP POLICY IF EXISTS "Authenticated users can view diary media" ON storage.objects;

-- New policy: can view diary-media only if the diary is public/accessible
-- Media paths: uid/<diary_id>/<filename>
-- We check that the diary referenced in the path is either public or owned by the user
CREATE POLICY "Users can view diary media from accessible diaries" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'diary-media'
    AND (
      -- User owns the media (folder matches their UID)
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      -- Or the diary is public — extract diary_id from path: uid/diary_id/filename
      EXISTS (
        SELECT 1 FROM public.diaries d
        WHERE d.id::text = (storage.foldername(name))[2]
          AND d.status = 'published'
          AND d.visibility = 'public'
      )
    )
  );
