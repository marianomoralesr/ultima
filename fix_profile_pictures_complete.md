# Fix Profile Picture Upload Issue

## Problem
Profile picture uploads are failing with "cannot save profile picture" error.

## Root Cause
The Supabase storage bucket `profile-pictures` either doesn't exist or lacks proper RLS policies.

## Solution

### Step 1: Create the Storage Bucket (if it doesn't exist)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Storage** in the left sidebar
3. Click **"New Bucket"**
4. Configure the bucket:
   - **Name**: `profile-pictures`
   - **Public**: ✅ **Yes** (enable public access)
   - **File size limit**: `5MB`
   - **Allowed MIME types**: `image/*`

### Step 2: Apply RLS Policies

Run this SQL in the Supabase SQL Editor:

```sql
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;

-- Policy 1: Allow authenticated users to upload profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND (storage.foldername(name))[1] = 'public'
  AND (storage.foldername(name))[2] = 'avatars'
);

-- Policy 2: Allow public read access to all profile pictures
CREATE POLICY "Public read access to profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Policy 3: Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'public'
  AND (storage.foldername(name))[2] = 'avatars'
)
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'public'
  AND (storage.foldername(name))[2] = 'avatars'
);

-- Policy 4: Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = 'public'
  AND (storage.foldername(name))[2] = 'avatars'
);
```

### Step 3: Verify Setup

After applying the SQL, test the profile picture upload:

1. Go to your Profile page
2. Click on "Cambiar foto"
3. Select an image file
4. Save the profile
5. The upload should now work!

## Technical Details

- **Storage Path Format**: `public/avatars/{userId}-{timestamp}.{ext}`
- **Bucket Name**: `profile-pictures`
- **Service Code**: `src/services/profileService.ts:116-132`

## Troubleshooting

If upload still fails:
1. Check browser console for specific error messages
2. Verify the bucket name is exactly `profile-pictures` (with hyphen, not underscore)
3. Ensure RLS is enabled on `storage.objects` table
4. Check that your user is authenticated when attempting upload
