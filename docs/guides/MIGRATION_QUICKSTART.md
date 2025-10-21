# Quick Start: Apply Profile Fix Migration

## TL;DR - Just Do This

1. **Go to Supabase Dashboard** → Your Project → **SQL Editor**

2. **Copy and paste this entire file**:
   ```
   supabase/migrations/20251015000002_fix_profile_creation_trigger.sql
   ```

3. **Click "Run"**

4. **Done!** The profile creation errors will stop immediately.

## What This Fixes

- ❌ **Before**: Infinite console errors about RLS policy violations
- ✅ **After**: Clean console, profiles created automatically

## Verify It Worked

Run this in SQL Editor:

```sql
-- Should return 1 row
SELECT COUNT(*) FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

## Test It

1. Sign out of your app
2. Create a new test user
3. Check console - should see `✅ Profile loaded successfully`
4. No more errors!

## Backfill Existing Users (Optional)

If you have users without profiles, run this SQL:

```sql
INSERT INTO public.profiles (
    id, email, first_name, last_name, phone, role, metadata, created_at, updated_at
)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'first_name', SPLIT_PART(u.raw_user_meta_data->>'full_name', ' ', 1)),
    COALESCE(u.raw_user_meta_data->>'last_name', NULLIF(SUBSTRING(u.raw_user_meta_data->>'full_name' FROM POSITION(' ' IN u.raw_user_meta_data->>'full_name') + 1), '')),
    u.phone,
    CASE
        WHEN u.email IN ('marianomorales@outlook.com', 'mariano.morales@autostrefa.mx', 'genauservices@gmail.com')
        THEN 'admin'
        ELSE 'user'
    END,
    COALESCE(u.raw_user_meta_data, '{}'::jsonb),
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

## Deploy Frontend Changes

The frontend code has already been updated. Just deploy:

```bash
# Build the project
npm run build

# Deploy to your hosting (Vercel/Netlify/etc)
# Or if using Docker:
docker build -t your-app .
```

## That's It!

No more RLS errors. Profiles are now created server-side via database trigger. 🎉

For detailed explanation, see: `supabase/migrations/README_PROFILE_FIX.md`
