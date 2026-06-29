# DATABASE_MIGRATION.md

> **Single SQL migration for the User Queries Module.**
> Run this **once** in Supabase Dashboard → SQL Editor.
> The script is **idempotent** — safe to re-run if any step fails partway.

---

## ⚠️ Before You Run

1. **Take a backup:**
   ```bash
   supabase db dump -f backup-pre-queries-$(date +%Y%m%d).sql
   ```
2. Confirm the helper functions from the previous RLS session already exist:
   ```sql
   SELECT proname FROM pg_proc
   WHERE proname IN ('is_admin', 'get_my_role', 'get_my_status')
   AND pronamespace = 'public'::regnamespace;
   ```
   Should return all 3 rows. If not, re-run the helper functions from `PROJECT_CONTEXT.md` § 6 first.
3. Make sure you're connected to the right project: `acxqgxsvyhctquthfack`.

---

## Migration Script (Run This)

```sql
-- =============================================================
-- USER QUERIES MODULE — MIGRATION 001
-- Cogent Assets · June 2026
-- =============================================================

-- ------------------------------------------------------------
-- 1. TABLES
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS asset_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query_type text NOT NULL CHECK (query_type IN ('issue_fault', 'new_asset_request', 'support_other')),
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL,
  requested_category_slug text,
  title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 100),
  description text NOT NULL CHECK (length(description) > 0 AND length(description) <= 2000),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT asset_or_category_required CHECK (
    (query_type = 'new_asset_request' AND requested_category_slug IS NOT NULL) OR
    (query_type IN ('issue_fault', 'support_other') AND asset_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_asset_queries_employee ON asset_queries(employee_id);
CREATE INDEX IF NOT EXISTS idx_asset_queries_status ON asset_queries(status);
CREATE INDEX IF NOT EXISTS idx_asset_queries_created ON asset_queries(created_at DESC);

CREATE TABLE IF NOT EXISTS query_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid NOT NULL REFERENCES asset_queries(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) > 0 AND length(body) <= 2000),
  is_system_message boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_comments_query ON query_comments(query_id, created_at);

CREATE TABLE IF NOT EXISTS query_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid NOT NULL REFERENCES asset_queries(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_attachments_query ON query_attachments(query_id);

CREATE TABLE IF NOT EXISTS query_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query_id uuid NOT NULL REFERENCES asset_queries(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('new_query', 'new_comment', 'status_changed')),
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_notif_recipient_unread
  ON query_notifications(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_query_notif_query ON query_notifications(query_id);

CREATE TABLE IF NOT EXISTS query_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid NOT NULL REFERENCES asset_queries(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_activity_query ON query_activity_log(query_id, created_at);

-- ------------------------------------------------------------
-- 2. TRIGGERS & FUNCTIONS
-- ------------------------------------------------------------

-- 2a. Auto-update updated_at on asset_queries
CREATE OR REPLACE FUNCTION update_query_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_query_timestamp ON asset_queries;
CREATE TRIGGER trg_update_query_timestamp
  BEFORE UPDATE ON asset_queries
  FOR EACH ROW EXECUTE FUNCTION update_query_timestamp();

-- 2b. Notify all admins + log activity on new query insert
CREATE OR REPLACE FUNCTION notify_admins_on_new_query()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO query_notifications (recipient_id, query_id, notification_type, payload)
  SELECT id, NEW.id, 'new_query',
         jsonb_build_object('title', NEW.title, 'employee_id', NEW.employee_id)
  FROM profiles
  WHERE role = 'admin' AND status = 'active';

  INSERT INTO query_activity_log (query_id, actor_id, action, after_state)
  VALUES (NEW.id, NEW.employee_id, 'created',
          jsonb_build_object('title', NEW.title, 'priority', NEW.priority, 'status', NEW.status));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_admins_on_new_query ON asset_queries;
CREATE TRIGGER trg_notify_admins_on_new_query
  AFTER INSERT ON asset_queries
  FOR EACH ROW EXECUTE FUNCTION notify_admins_on_new_query();

-- 2c. Notify other party on comment + log activity
CREATE OR REPLACE FUNCTION notify_on_query_comment()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id uuid;
  v_actor_role text;
BEGIN
  SELECT employee_id INTO v_employee_id FROM asset_queries WHERE id = NEW.query_id;
  SELECT role INTO v_actor_role FROM profiles WHERE id = NEW.author_id;

  -- Admin commented → notify the query's employee
  IF v_actor_role = 'admin' AND NEW.author_id != v_employee_id THEN
    INSERT INTO query_notifications (recipient_id, query_id, notification_type, payload)
    VALUES (v_employee_id, NEW.query_id, 'new_comment',
            jsonb_build_object('author_id', NEW.author_id));
  END IF;

  -- Employee commented → notify all admins
  IF v_actor_role = 'employee' THEN
    INSERT INTO query_notifications (recipient_id, query_id, notification_type, payload)
    SELECT id, NEW.query_id, 'new_comment', jsonb_build_object('author_id', NEW.author_id)
    FROM profiles WHERE role = 'admin' AND status = 'active';
  END IF;

  -- Activity log (skip system messages to avoid double-logging)
  IF NEW.is_system_message = false THEN
    INSERT INTO query_activity_log (query_id, actor_id, action, after_state)
    VALUES (NEW.query_id, NEW.author_id, 'comment_added',
            jsonb_build_object('body_preview', left(NEW.body, 100)));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_on_query_comment ON query_comments;
CREATE TRIGGER trg_notify_on_query_comment
  AFTER INSERT ON query_comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_query_comment();

-- 2d. Handle status change — inject system message + notify employee + log
CREATE OR REPLACE FUNCTION handle_query_status_change()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid;
  v_actor_name text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_actor_id := auth.uid();
    SELECT name INTO v_actor_name FROM profiles WHERE id = v_actor_id;

    INSERT INTO query_comments (query_id, author_id, body, is_system_message)
    VALUES (NEW.id, v_actor_id,
            'Status changed: ' || OLD.status || ' → ' || NEW.status, true);

    INSERT INTO query_notifications (recipient_id, query_id, notification_type, payload)
    VALUES (NEW.employee_id, NEW.id, 'status_changed',
            jsonb_build_object('from', OLD.status, 'to', NEW.status, 'by', COALESCE(v_actor_name, 'Admin')));

    INSERT INTO query_activity_log (query_id, actor_id, action, before_state, after_state)
    VALUES (NEW.id, v_actor_id, 'status_changed',
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_query_status_change ON asset_queries;
CREATE TRIGGER trg_handle_query_status_change
  AFTER UPDATE ON asset_queries
  FOR EACH ROW EXECUTE FUNCTION handle_query_status_change();

-- ------------------------------------------------------------
-- 3. ENABLE RLS
-- ------------------------------------------------------------

ALTER TABLE asset_queries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_attachments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_activity_log   ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 4. RLS POLICIES — asset_queries
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "employees_read_own_queries" ON asset_queries;
CREATE POLICY "employees_read_own_queries" ON asset_queries
  FOR SELECT USING (employee_id = auth.uid());

DROP POLICY IF EXISTS "admins_read_all_queries" ON asset_queries;
CREATE POLICY "admins_read_all_queries" ON asset_queries
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "employees_insert_own_queries" ON asset_queries;
CREATE POLICY "employees_insert_own_queries" ON asset_queries
  FOR INSERT WITH CHECK (employee_id = auth.uid());

DROP POLICY IF EXISTS "employees_update_own_pending_queries" ON asset_queries;
CREATE POLICY "employees_update_own_pending_queries" ON asset_queries
  FOR UPDATE USING (
    employee_id = auth.uid()
    AND status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM query_comments qc
      JOIN profiles p ON p.id = qc.author_id
      WHERE qc.query_id = asset_queries.id
        AND p.role = 'admin'
        AND qc.is_system_message = false
    )
  )
  WITH CHECK (employee_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "admins_update_any_query" ON asset_queries;
CREATE POLICY "admins_update_any_query" ON asset_queries
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "employees_delete_own_pending_queries" ON asset_queries;
CREATE POLICY "employees_delete_own_pending_queries" ON asset_queries
  FOR DELETE USING (
    employee_id = auth.uid()
    AND status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM query_comments qc
      JOIN profiles p ON p.id = qc.author_id
      WHERE qc.query_id = asset_queries.id
        AND p.role = 'admin'
        AND qc.is_system_message = false
    )
  );

DROP POLICY IF EXISTS "admins_delete_any_query" ON asset_queries;
CREATE POLICY "admins_delete_any_query" ON asset_queries
  FOR DELETE USING (public.is_admin(auth.uid()));

-- ------------------------------------------------------------
-- 5. RLS POLICIES — query_comments
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "comments_read" ON query_comments;
CREATE POLICY "comments_read" ON query_comments
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM asset_queries q
      WHERE q.id = query_comments.query_id AND q.employee_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "comments_insert" ON query_comments;
CREATE POLICY "comments_insert" ON query_comments
  FOR INSERT WITH CHECK (
    author_id = auth.uid()
    AND is_system_message = false
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM asset_queries q
        WHERE q.id = query_comments.query_id AND q.employee_id = auth.uid()
      )
    )
  );

-- No UPDATE, no DELETE policies — comments are immutable.

-- ------------------------------------------------------------
-- 6. RLS POLICIES — query_attachments
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "attachments_read" ON query_attachments;
CREATE POLICY "attachments_read" ON query_attachments
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM asset_queries q
      WHERE q.id = query_attachments.query_id AND q.employee_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "attachments_insert" ON query_attachments;
CREATE POLICY "attachments_insert" ON query_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM asset_queries q
      WHERE q.id = query_attachments.query_id AND q.employee_id = auth.uid()
    )
  );

-- Deletes cascade from asset_queries.

-- ------------------------------------------------------------
-- 7. RLS POLICIES — query_notifications
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "notif_read_own" ON query_notifications;
CREATE POLICY "notif_read_own" ON query_notifications
  FOR SELECT USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "notif_update_own" ON query_notifications;
CREATE POLICY "notif_update_own" ON query_notifications
  FOR UPDATE USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- INSERTs handled by SECURITY DEFINER triggers — no client INSERT policy.

-- ------------------------------------------------------------
-- 8. RLS POLICIES — query_activity_log
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "activity_log_read" ON query_activity_log;
CREATE POLICY "activity_log_read" ON query_activity_log
  FOR SELECT USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM asset_queries q
      WHERE q.id = query_activity_log.query_id AND q.employee_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies — only triggers (SECURITY DEFINER) write to this table.

-- ------------------------------------------------------------
-- 9. ENABLE REALTIME on relevant tables
-- ------------------------------------------------------------

-- Realtime publication: add the tables we want to broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE asset_queries;
ALTER PUBLICATION supabase_realtime ADD TABLE query_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE query_notifications;

-- ------------------------------------------------------------
-- MIGRATION COMPLETE
-- ------------------------------------------------------------
```

---

## Storage Bucket Setup (Manual via Dashboard)

The Storage bucket must be created in the Supabase Dashboard UI **and** have its policies set via SQL.

### Step 1 — Create the bucket

1. Supabase Dashboard → **Storage** → **New bucket**
2. Name: `query-attachments`
3. Public: **OFF**
4. File size limit: **10485760** (10 MB)
5. Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`
6. Click Create.

### Step 2 — Add storage policies (run in SQL editor)

```sql
-- Upload: only the query owner (employee) or any admin
CREATE POLICY "query_attach_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'query-attachments'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM asset_queries q
        WHERE q.employee_id = auth.uid()
          AND (storage.foldername(name))[1] = q.id::text
      )
    )
  );

-- Read: admins or the owning employee
CREATE POLICY "query_attach_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'query-attachments'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM asset_queries q
        WHERE q.employee_id = auth.uid()
          AND (storage.foldername(name))[1] = q.id::text
      )
    )
  );

-- Delete: admins anytime; employee only while their query is pending
CREATE POLICY "query_attach_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'query-attachments'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM asset_queries q
        WHERE q.employee_id = auth.uid()
          AND q.status = 'pending'
          AND (storage.foldername(name))[1] = q.id::text
      )
    )
  );
```

---

## Verification Queries

Run these after migration to confirm everything is in place.

```sql
-- 1. All tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('asset_queries', 'query_comments', 'query_attachments', 'query_notifications', 'query_activity_log')
ORDER BY table_name;
-- Should return 5 rows.

-- 2. RLS enabled on all new tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('asset_queries', 'query_comments', 'query_attachments', 'query_notifications', 'query_activity_log');
-- Each row should show rowsecurity = true.

-- 3. Policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public'
  AND tablename LIKE 'query%' OR tablename = 'asset_queries'
ORDER BY tablename, policyname;
-- Should return 13+ rows.

-- 4. Triggers exist
SELECT tgname, tgrelid::regclass AS table FROM pg_trigger
WHERE NOT tgisinternal
  AND tgrelid::regclass::text IN ('asset_queries', 'query_comments')
ORDER BY table, tgname;
-- Should show all 4 triggers.

-- 5. Realtime publication includes new tables
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename LIKE 'query%' OR tablename = 'asset_queries'
ORDER BY tablename;
-- Should include asset_queries, query_comments, query_notifications.
```

---

## Rollback Script (If Needed)

⚠️ Use only if you need to fully reverse this migration. **All query data will be lost.**

```sql
-- Drop in reverse dependency order
DROP TRIGGER IF EXISTS trg_handle_query_status_change ON asset_queries;
DROP TRIGGER IF EXISTS trg_notify_admins_on_new_query ON asset_queries;
DROP TRIGGER IF EXISTS trg_update_query_timestamp ON asset_queries;
DROP TRIGGER IF EXISTS trg_notify_on_query_comment ON query_comments;

DROP FUNCTION IF EXISTS handle_query_status_change();
DROP FUNCTION IF EXISTS notify_on_query_comment();
DROP FUNCTION IF EXISTS notify_admins_on_new_query();
DROP FUNCTION IF EXISTS update_query_timestamp();

DROP TABLE IF EXISTS query_activity_log;
DROP TABLE IF EXISTS query_notifications;
DROP TABLE IF EXISTS query_attachments;
DROP TABLE IF EXISTS query_comments;
DROP TABLE IF EXISTS asset_queries;

-- Storage bucket: delete manually via Dashboard
```

---

**Last updated:** June 2026
