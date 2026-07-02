# Query Attachments Setup

## 1. Create Storage Bucket

Run this in the **Supabase SQL Editor**:

```sql
-- Create the storage bucket for query attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'query-attachments',
  'query-attachments',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;
```

## 2. Storage RLS Policies

```sql
-- Allow authenticated users to upload to their own query folders
DROP POLICY IF EXISTS "query_attachments_upload" ON storage.objects;
CREATE POLICY "query_attachments_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'query-attachments'
    AND EXISTS (
      SELECT 1 FROM asset_queries q
      WHERE q.id::text = (storage.foldername(name))[1]
        AND q.employee_id = auth.uid()
    )
  );

-- Allow reading attachments (admins see all, employees see own query's files)
DROP POLICY IF EXISTS "query_attachments_read" ON storage.objects;
CREATE POLICY "query_attachments_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'query-attachments'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM asset_queries q
        WHERE q.id::text = (storage.foldername(name))[1]
          AND q.employee_id = auth.uid()
      )
    )
  );

-- Allow service_role to delete (for cleanup Edge Function)
DROP POLICY IF EXISTS "query_attachments_delete_service" ON storage.objects;
CREATE POLICY "query_attachments_delete_service" ON storage.objects
  FOR DELETE TO service_role
  USING (bucket_id = 'query-attachments');

-- Also allow admins to delete if needed
DROP POLICY IF EXISTS "query_attachments_delete_admin" ON storage.objects;
CREATE POLICY "query_attachments_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'query-attachments'
    AND public.is_admin(auth.uid())
  );

-- Allow employees to delete their own query attachments
DROP POLICY IF EXISTS "query_attachments_delete_employee" ON storage.objects;
CREATE POLICY "query_attachments_delete_employee" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'query-attachments'
    AND EXISTS (
      SELECT 1 FROM asset_queries q
      WHERE q.id::text = (storage.foldername(name))[1]
        AND q.employee_id = auth.uid()
    )
  );
```

## 3. Auto-Cleanup Edge Function

Create this as a Supabase Edge Function named `cleanup-query-attachments`.

### Deploy via Supabase CLI:

```bash
supabase functions new cleanup-query-attachments
```

Then replace the generated `index.ts` with:

```typescript
// supabase/functions/cleanup-query-attachments/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const BUCKET = 'query-attachments'
const DAYS_AFTER_RESOLVED = 2

Deno.serve(async (req) => {
  // Verify this is called by cron (optional: add a secret header check)
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  try {
    // Find attachments for queries resolved more than 2 days ago
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - DAYS_AFTER_RESOLVED)

    const { data: attachments, error: fetchError } = await supabase
      .from('query_attachments')
      .select('id, storage_path, query_id, asset_queries!inner(status, updated_at)')
      .eq('asset_queries.status', 'resolved')
      .lt('asset_queries.updated_at', cutoff.toISOString())

    if (fetchError) throw fetchError
    if (!attachments || attachments.length === 0) {
      return new Response(JSON.stringify({ message: 'No attachments to clean up', count: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Delete from storage
    const storagePaths = attachments.map((a: any) => a.storage_path)
    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .remove(storagePaths)
    if (storageError) console.error('Storage delete error:', storageError)

    // Delete DB rows
    const ids = attachments.map((a: any) => a.id)
    const { error: dbError } = await supabase
      .from('query_attachments')
      .delete()
      .in('id', ids)
    if (dbError) console.error('DB delete error:', dbError)

    return new Response(
      JSON.stringify({ message: `Cleaned up ${ids.length} attachment(s)`, count: ids.length }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

### Deploy:

```bash
supabase functions deploy cleanup-query-attachments --no-verify-jwt
```

### Schedule with pg_cron (runs daily at 3 AM UTC):

```sql
-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup to run daily at 3 AM UTC
SELECT cron.schedule(
  'cleanup-query-attachments',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/cleanup-query-attachments',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

**Alternative (simpler):** If you don't want to use pg_cron, you can use the Supabase Dashboard:
1. Go to **Database > Extensions** → enable `pg_cron` and `pg_net`
2. Go to **Edge Functions** → find `cleanup-query-attachments`
3. Set up a schedule via the Supabase Dashboard cron job UI

## Summary

| What | Where | Auto-deleted? |
|------|-------|---------------|
| Query text, comments, status | `asset_queries`, `query_comments` | ❌ Never — stays permanently |
| Attachment image file | `query-attachments` bucket | ✅ 2 days after resolved |
| Attachment DB record | `query_attachments` table | ✅ 2 days after resolved |
| Notifications, activity log | `query_notifications`, `query_activity_log` | ❌ Never |
