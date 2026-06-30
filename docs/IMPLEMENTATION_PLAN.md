# User Queries Module — Implementation Plan

> **Module:** Employee Query & Issue Reporting System
> **Target Repo:** `aizaz-js/Assets-Management`
> **Live:** https://assets.cogentlabs.co
> **PRD Reference:** [Cogent Assets Management PRD — Module: User Queries](https://docs.google.com/document/d/1WfFyOBBlHV6_Dc0Abi0K62LxL5ZR995JsIByr8McGdc/edit?tab=t.kifr9feek6kd)
> **Owner:** Aizaz Sadaqat
> **Status:** Ready for implementation
> **Estimated effort:** 5–7 working days (single developer)

---

## 📌 How to Use This Plan with Claude Code

1. Open Claude Code in the repo root: `cd Assets-Management && claude`
2. Tell Claude Code: **"Read `/docs/PROJECT_CONTEXT.md`, `/docs/IMPLEMENTATION_PLAN.md`, `/docs/DATABASE_MIGRATION.md`, `/docs/UI_GUIDELINES.md`, then begin Phase 1."**
3. Work phase-by-phase. **Do not skip phases.** Each phase has explicit acceptance criteria — Claude Code must confirm all are met before moving to the next.
4. After each phase, commit with the message format: `feat(queries): phase N — <phase title>`

---

## 🎨 Design System Reference

The new module must visually match the existing Cogent Assets portal exactly. The portal uses a clean, professional design with these tokens:

| Token        | Value                 | Usage                             |
| ------------ | --------------------- | --------------------------------- |
| Primary      | `#0F1A2B` (dark navy) | Headers, primary buttons, sidebar |
| Accent       | `#3B82F6` (blue-500)  | Links, active states, focus rings |
| Background   | `#F9FAFB`             | Page background                   |
| Surface      | `#FFFFFF`             | Cards, drawers, modals            |
| Border       | `#E5E7EB`             | Table borders, dividers           |
| Text Primary | `#1F2937`             | Body text                         |
| Text Muted   | `#6B7280`             | Captions, labels                  |
| Success      | `#10B981`             | Resolved status                   |
| Warning      | `#F59E0B`             | Pending status                    |
| Danger       | `#EF4444`             | Rejected, delete                  |
| Info         | `#3B82F6`             | In Progress status                |

**Animation library:** Use `framer-motion` (install if not present). All transitions should be smooth (200–300ms ease-out). All interactive elements get hover states.

**Font:** Match existing — Inter or system-ui stack.

---

## 🗂️ Phase Overview

| Phase | Focus                                          | Est. Time | Risk                       |
| ----- | ---------------------------------------------- | --------- | -------------------------- |
| 0     | Pre-flight checks + dependency install         | 30 min    | Low                        |
| 1     | Database migration (tables, triggers, RLS)     | 2 hours   | **High** — DB changes      |
| 2     | Auth & role-based routing                      | 4 hours   | Medium                     |
| 3     | Shared hooks, types, and utilities             | 3 hours   | Low                        |
| 4     | Shared components (badges, timeline, composer) | 4 hours   | Low                        |
| 5     | Employee portal (`/employee/queries/*`)        | 1 day     | Medium                     |
| 6     | Admin Queries tab + filters + list             | 6 hours   | Low                        |
| 7     | Admin Query detail drawer + status changes     | 4 hours   | Medium                     |
| 8     | Notification system (bell, modal, toast)       | 6 hours   | Medium                     |
| 9     | Realtime wiring (Supabase subscriptions)       | 3 hours   | **High** — cleanup matters |
| 10    | Polish, animations, accessibility              | 4 hours   | Low                        |
| 11    | Testing checklist + smoke tests                | 2 hours   | Low                        |
| 12    | Deployment + rollout                           | 1 hour    | Low                        |

---

# Phase 0 — Pre-flight Checks

**Goal:** Confirm the environment is ready before any code changes.

### Tasks

1. Pull latest `main`:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Create a feature branch:
   ```bash
   git checkout -b feat/user-queries-module
   ```
3. Confirm `.env.local` contains:
   ```env
   VITE_SUPABASE_URL=https://acxqgxsvyhctquthfack.supabase.co
   VITE_SUPABASE_ANON_KEY=...
   VITE_ALLOWED_EMAIL_DOMAIN=cogentlabs.co
   ```
4. Install new dependencies:
   ```bash
   npm install framer-motion react-hot-toast date-fns
   npm install -D @types/node
   ```
5. Verify the dev server starts cleanly: `npm run dev` → app loads on port 3000, login works.
6. Take a database snapshot from Supabase before any migration:
   ```bash
   supabase db dump -f backup-pre-queries-$(date +%Y%m%d).sql
   ```

### Acceptance Criteria

- [ ] On `feat/user-queries-module` branch
- [ ] `npm run dev` runs without errors
- [ ] DB backup file exists locally
- [ ] `framer-motion`, `react-hot-toast`, `date-fns` appear in `package.json`

---

# Phase 1 — Database Migration

**Goal:** Create all new tables, triggers, functions, and RLS policies. Verify nothing existing breaks.

### ⚠️ Critical Order

Run migrations **in this exact order** to avoid FK / policy resolution errors:

1. Helper functions (`is_admin`, `get_my_role`, `get_my_status`) — **already done in previous session, verify they exist**
2. New tables (`asset_queries`, `query_comments`, `query_attachments`, `query_notifications`, `query_activity_log`)
3. Indexes
4. Triggers and trigger functions
5. RLS policies (enable RLS, then add policies)
   > **Note:** No storage bucket needed — V1 is plain text only. The `query_attachments` table exists in the schema but will not be used until file upload is added in a future version.

### Tasks

1. Open the file `/docs/DATABASE_MIGRATION.md` — copy the full migration SQL.
2. In Supabase Dashboard → SQL Editor → create a new query, paste the migration, **run it once**.
3. Verify:
   - All 5 new tables exist (`select * from information_schema.tables where table_name like 'query%' or table_name = 'asset_queries'`)
   - RLS is enabled on each (`select tablename, rowsecurity from pg_tables where schemaname = 'public'`)
   - Triggers exist (`select tgname from pg_trigger where tgrelid::regclass::text in ('asset_queries','query_comments')`)
   - Storage bucket `query-attachments` is created (Dashboard → Storage)
4. **Regression test the admin app** before writing any frontend code:
   - Log in as admin
   - View Users page → all users visible
   - Create a test user → succeeds
   - View Assets page → all assets load with allotted user names
   - View Repair page → all records load
   - Delete the test user → succeeds

### Acceptance Criteria

- [ ] All 5 tables created with correct columns and constraints
- [ ] All RLS policies created
- [x] Storage bucket SKIPPED — V1 is plain text only, no file uploads
- [ ] All existing admin flows work without errors
- [ ] No console errors in browser DevTools while navigating admin pages

---

# Phase 2 — Auth & Role-Based Routing

**Goal:** Replace the current admin-only auth flow with role-aware routing. Employees go to `/employee/queries`. Admins continue to `/dashboard`.

### File Changes

| File                                 | Action                                                   |
| ------------------------------------ | -------------------------------------------------------- |
| `src/features/auth/AuthProvider.tsx` | Update to expose `role`, `status`, refetch on navigation |
| `src/pages/CallbackPage.tsx`         | Branch redirect on role                                  |
| `src/components/RoleGuard.tsx`       | **NEW** — route-level guard component                    |
| `src/App.tsx` (or router config)     | Wrap routes with `RoleGuard`                             |
| `src/pages/Unauthorized.tsx`         | **NEW** — fallback page                                  |
| `src/lib/supabase.ts`                | Ensure session refresh works                             |

### Implementation Notes

**`RoleGuard.tsx` skeleton:**

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';

interface RoleGuardProps {
  requiredRole: 'admin' | 'employee';
  children: React.ReactNode;
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const { profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!profile) return <Navigate to="/" replace />;
  if (profile.status !== 'active') return <Navigate to="/unauthorized" replace />;

  if (profile.role !== requiredRole) {
    const redirectTo = profile.role === 'admin' ? '/dashboard' : '/employee/queries';
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
```

**Routing structure:**

```typescript
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route path="/callback" element={<CallbackPage />} />
  <Route path="/unauthorized" element={<Unauthorized />} />

  {/* Admin routes */}
  <Route element={<RoleGuard requiredRole="admin"><AdminLayout /></RoleGuard>}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/assets" element={<Assets />} />
    <Route path="/repair" element={<Repair />} />
    <Route path="/users" element={<Users />} />
    <Route path="/summary" element={<Summary />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/queries" element={<QueryListAdmin />} />
    <Route path="/queries/:id" element={<QueryDetailAdmin />} />
  </Route>

  {/* Employee routes */}
  <Route element={<RoleGuard requiredRole="employee"><EmployeeLayout /></RoleGuard>}>
    <Route path="/employee/queries" element={<QueryListEmployee />} />
    <Route path="/employee/queries/new" element={<NewQuery />} />
    <Route path="/employee/queries/:id" element={<QueryDetailEmployee />} />
  </Route>

  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

**CallbackPage logic:**

```typescript
// After Supabase session is established:
const { data: profile } = await supabase
	.from('profiles')
	.select('role, status')
	.eq('id', session.user.id)
	.single();

if (!profile) {
	await signOut('Account not registered. Contact your admin.');
	return;
}
if (profile.status !== 'active') {
	await signOut('Access deactivated.');
	return;
}

navigate(profile.role === 'admin' ? '/dashboard' : '/employee/queries', {
	replace: true,
});
```

### Acceptance Criteria

- [ ] Admin login → lands on `/dashboard` as before
- [ ] Employee login (manually flip a test user to `employee` in DB) → lands on `/employee/queries`
- [ ] Employee typing `/dashboard` in URL → redirected to `/employee/queries`
- [ ] Admin typing `/employee/queries` in URL → redirected to `/dashboard`
- [ ] Inactive user → forced sign-out with error message
- [ ] Unregistered user → forced sign-out with error message
- [ ] No console errors during navigation

---

# Phase 3 — Shared Hooks, Types & Utilities

**Goal:** Build the data layer foundation that both employee and admin UIs will consume.

### File Changes

| File                                 | Purpose                                               |
| ------------------------------------ | ----------------------------------------------------- |
| `src/types/queries.ts`               | TypeScript types for queries, comments, notifications |
| `src/hooks/useQueries.ts`            | List queries (role-aware)                             |
| `src/hooks/useQuery.ts`              | Single query + comments                               |
| `src/hooks/useQueryMutations.ts`     | create / update / delete / addComment                 |
| `src/hooks/useNotifications.ts`      | List + mark-read mutations                            |
| `src/hooks/useMyAssignedAssets.ts`   | Employee's allotted assets                            |
| `src/hooks/useEmployeeCategories.ts` | Employee-allocated categories                         |
| `src/lib/queries-constants.ts`       | Status/priority enums + label maps                    |

### Type Definitions

```typescript
// src/types/queries.ts
export type QueryType = 'issue_fault' | 'new_asset_request' | 'support_other';
export type QueryStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';
export type QueryPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationType = 'new_query' | 'new_comment' | 'status_changed';

export interface AssetQuery {
	id: string;
	employee_id: string;
	employee?: { id: string; name: string; email: string };
	query_type: QueryType;
	asset_id: string | null;
	asset?: {
		id: string;
		asset_tag: string;
		manufacturer: string;
		specs: string;
	};
	requested_category_slug: string | null;
	requested_category?: { name: string; slug: string };
	title: string;
	description: string;
	priority: QueryPriority;
	status: QueryStatus;
	created_at: string;
	updated_at: string;
}

export interface QueryComment {
	id: string;
	query_id: string;
	author_id: string;
	author?: { name: string; role: 'admin' | 'employee' };
	body: string;
	is_system_message: boolean;
	created_at: string;
}

// QueryAttachment type reserved for future file upload feature (not used in V1)

export interface QueryNotification {
	id: string;
	recipient_id: string;
	query_id: string;
	notification_type: NotificationType;
	payload: { title?: string; from?: string; to?: string; by?: string };
	read_at: string | null;
	created_at: string;
}
```

### Hook Pattern (React Query)

Use the same React Query pattern as existing hooks (`useAssets`, `useRepairs`). Always invalidate the right keys after mutations.

```typescript
// src/hooks/useQueries.ts
export function useQueries(filters?: QueryFilters) {
	const { profile } = useAuth();
	return useReactQuery({
		queryKey: ['queries', profile?.id, filters],
		queryFn: async () => {
			let q = supabase
				.from('asset_queries')
				.select(
					`
        *,
        employee:profiles!employee_id(id, name, email),
        asset:assets(id, asset_tag, manufacturer, specs)
      `,
				)
				.order('created_at', { ascending: false });

			if (filters?.status) q = q.eq('status', filters.status);
			if (filters?.priority) q = q.eq('priority', filters.priority);
			// ... other filters
			const { data, error } = await q;
			if (error) throw error;
			return data;
		},
		enabled: !!profile,
	});
}
```

### Acceptance Criteria

- [ ] All hooks created with correct TypeScript types
- [ ] No `any` types used
- [ ] Hooks tested in isolation (call them from a temporary debug component)
- [ ] React Query DevTools show queries are caching correctly

---

# Phase 4 — Shared Components

**Goal:** Build the reusable UI components used by both employee and admin sides.

### Components to Build

| Component                | File                                         | Purpose                                       |
| ------------------------ | -------------------------------------------- | --------------------------------------------- |
| `StatusBadge`            | `src/components/queries/StatusBadge.tsx`     | Color-coded status pill                       |
| `PriorityBadge`          | `src/components/queries/PriorityBadge.tsx`   | Color-coded priority badge                    |
| `QueryTypePill`          | `src/components/queries/QueryTypePill.tsx`   | Icon + label for query type                   |
| `QueryTimeline`          | `src/components/queries/QueryTimeline.tsx`   | Vertical timeline of comments + system events |
| `CommentComposer`        | `src/components/queries/CommentComposer.tsx` | Textarea + send button + keyboard shortcuts   |
| `QueryForm`              | `src/components/queries/QueryForm.tsx`       | Create / edit form, branches on type          |
| ~~`AttachmentUploader`~~ | Skipped — no file uploads in V1              |
| ~~`AttachmentPreview`~~  | Skipped — no file uploads in V1              |
| `EmptyState`             | `src/components/queries/EmptyState.tsx`      | Reusable empty state with illustration        |

### Animation Specs (framer-motion)

**Timeline items** — stagger fade-in:

```typescript
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.05 }}
>
```

**Status badge** — color transition on change:

```typescript
<motion.span
  layout
  transition={{ duration: 0.2 }}
  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[status]}`}
>
```

**Modal/drawer open** — slide + fade:

```typescript
<motion.div
  initial={{ x: '100%', opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: '100%', opacity: 0 }}
  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
>
```

**Hover on cards** — subtle lift:

```typescript
whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(15,26,43,0.08)' }}
transition={{ duration: 0.2 }}
```

### StatusBadge Reference Implementation

```typescript
const STATUS_STYLES: Record<QueryStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const STATUS_DOT: Record<QueryStatus, string> = {
  pending: 'bg-amber-500',
  in_progress: 'bg-blue-500',
  resolved: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

export function StatusBadge({ status }: { status: QueryStatus }) {
  return (
    <motion.span layout transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABELS[status]}
    </motion.span>
  );
}
```

### Acceptance Criteria

- [ ] All components render in isolation (use Storybook or a `/debug` route)
- [ ] All animations smooth at 60fps in Chrome DevTools Performance tab
- [ ] All components keyboard-accessible (Tab navigates, Enter submits)
- [ ] ARIA labels present on icons
- [ ] Dark navy color scheme matches existing portal

---

# Phase 5 — Employee Portal

**Goal:** Build the entire employee-facing experience: list view, new query, edit, delete, detail.

### Routes

- `/employee/queries` — list view
- `/employee/queries/new` — create form
- `/employee/queries/:id` — detail view with timeline

### Pages

#### `QueryListEmployee.tsx`

- Header: "My Queries" + "+ New Query" button
- Filter pills: All / Pending / In Progress / Resolved / Rejected (animated underline on active)
- List of query cards (animated stagger on load)
- Empty state if no queries
- Notification bell in header
- Three-dot menu on each card (Edit/Delete) — only when `status === 'pending'` AND no admin comments

#### `NewQuery.tsx` (or modal)

- Step 1: Pick query type (3 large clickable cards with icons)
- Step 2: Form fields based on type
  - Asset/Category dropdown (searchable)
  - Title, Description, Priority
  - Drag & drop attachments
- Submit → toast → navigate to detail
- Cancel → confirm if data entered

#### `QueryDetailEmployee.tsx`

- Header with title, status pill, priority badge, created date
- Asset card showing tag, manufacturer, specs (if applicable)
- `QueryTimeline` component
- `CommentComposer` at bottom

### Layout Component

```typescript
// src/components/layout/EmployeeLayout.tsx
export function EmployeeLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-lg font-semibold text-gray-900">My Queries</h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <ProfileDropdown />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

### Acceptance Criteria

- [ ] Employee can create all 3 query types
- [ ] Asset dropdown only shows their own assigned, non-retired assets
- [ ] Category dropdown shows all employee-allocated categories
- [ ] Edit/Delete only visible on `pending` + no admin comments
- [ ] Delete cascades correctly (comments removed with query)
- [ ] All animations smooth
- [ ] Mobile responsive (test at 360px width)
- [ ] Empty state shows when no queries

---

# Phase 6 — Admin Queries List

**Goal:** Add the Queries tab to the admin sidebar with full list view.

### File Changes

- `src/components/Sidebar.tsx` — add Queries item with pill badge
- `src/pages/QueryListAdmin.tsx` — **NEW**
- `src/components/queries/QueryFiltersAdmin.tsx` — **NEW**

### Sidebar Update

Add new item between "Repair" and "Users":

```typescript
{
  to: '/queries',
  label: 'Queries',
  icon: <MessageSquareIcon />,
  badge: unreadQueryCount, // from useUnreadCount() hook
}
```

The badge animates with a subtle pulse when count > 0:

```typescript
{badge > 0 && (
  <motion.span
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-red-500 rounded-full"
  >
    {badge > 99 ? '99+' : badge}
  </motion.span>
)}
```

### List Page Structure

- Header: "Employee Queries" + total count
- Filter bar (collapsible): Status, Priority, Type, Employee (multi-select), Date range
- Table with alternating row colors (match existing patterns)
- Columns: Employee · Type · Title · Asset · Priority · Status · Created
- Unread rows: bold text + colored dot on left edge
- Default sort: unread first, then created_at desc
- Click row → open detail drawer

### Acceptance Criteria

- [ ] Queries sidebar item appears for admin only
- [ ] Unread badge shows correct count and pulses on new query
- [ ] All filters work and combine correctly
- [ ] Table renders 1000+ rows without lag (virtualize if needed)
- [ ] Unread rows visually distinct
- [ ] Empty state when filters return nothing

---

# Phase 7 — Admin Query Detail Drawer

**Goal:** Side drawer where admins view queries and respond.

### Component

`src/features/queries/QueryDetailAdminDrawer.tsx` — reuse the existing drawer pattern from `AssetDetailDrawer` for consistency.

### Drawer Layout

```
┌─────────────────────────────────────────────┐
│ ← Back   Laptop screen flickering     [X]   │
│          Aizaz Sadaqat · LT-0042            │
├─────────────────────────────────────────────┤
│ [Priority: High] [Status: Pending ▾]        │
├─────────────────────────────────────────────┤
├─────────────────────────────────────────────┤
│ ─── Timeline ───                            │
│ ⚙️  Created · 2h ago                         │
│ 💬 Aizaz · 2h ago                            │
│    Screen flickers when I open the lid.     │
│                                             │
│ ⚙️  Status: Pending → In Progress           │
│    by Sher Ali · 1h ago                     │
│                                             │
│ 💬 Sher Ali (Admin) · 1h ago                │
│    Bringing to repair vendor today.         │
├─────────────────────────────────────────────┤
│ [Write a reply...]                  [Send]  │
└─────────────────────────────────────────────┘
```

### Status Change Flow

1. Admin clicks status dropdown → see options: `In Progress`, `Resolved`, `Rejected`
2. If `Rejected` selected → modal asks for mandatory reason
3. Confirmation: "Change status to {X}?"
4. On confirm → mutation fires → trigger inserts system message → realtime updates UI

### Acceptance Criteria

- [ ] Drawer slides in smoothly from right
- [ ] Status changes work and create system messages in timeline
- [ ] Rejected status requires reason
- [ ] Comments post correctly
- [ ] Timeline auto-scrolls to bottom on new comment
- [ ] Markings as read on drawer open (per-admin)

---

# Phase 8 — Notification System

**Goal:** Bell icon, notification modal, toasts, browser title updates.

### Components

- `src/components/notifications/NotificationBell.tsx`
- `src/components/notifications/NotificationModal.tsx`
- `src/components/notifications/NotificationItem.tsx`
- `src/hooks/useUnreadCount.ts`
- `src/lib/document-title.ts`

### Bell + Modal Behavior

- Bell icon top-right in both admin header and employee header
- Red pill with count when unread > 0
- Click → animated dropdown modal (anchored right)
- "Mark all as read" button at top
- List of last 30 notifications, newest first
- Click item → navigate + mark that notification read
- Empty state: "No notifications"
- Modal closes on outside click or Esc key

### Modal Animation

```typescript
<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl ring-1 ring-gray-200 z-50"
    >
      {/* content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Toast Behavior

Use `react-hot-toast` for consistency:

```typescript
import toast from 'react-hot-toast';

toast.custom((t) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: t.visible ? 1 : 0, y: t.visible ? 0 : 50 }}
    onClick={() => navigate(`/queries/${queryId}`)}
    className="bg-white rounded-lg shadow-xl ring-1 ring-gray-200 px-4 py-3 cursor-pointer max-w-sm"
  >
    <div className="flex items-start gap-3">
      <BellIcon className="text-blue-500 mt-0.5" />
      <div>
        <p className="font-medium text-gray-900">New query from {employeeName}</p>
        <p className="text-sm text-gray-600 mt-0.5">{title}</p>
      </div>
    </div>
  </motion.div>
), { duration: 6000, position: 'bottom-right' });
```

### Document Title Update

```typescript
// src/lib/document-title.ts
export function setUnreadTitle(count: number) {
	document.title = count > 0 ? `(${count}) Cogent Assets` : 'Cogent Assets';
}
```

Call this from a `useEffect` watching unread count.

### Acceptance Criteria

- [ ] Bell appears for both admin and employee
- [ ] Unread count accurate
- [ ] Modal opens with smooth animation
- [ ] Click notification → navigates + marks read
- [ ] "Mark all as read" works
- [ ] Browser tab title updates with count
- [ ] Toast appears for admins on new query

---

# Phase 9 — Realtime Wiring

**Goal:** Hook up Supabase Realtime subscriptions for live notifications and timeline updates.

### Hook: `useRealtimeNotifications`

```typescript
// src/hooks/useRealtimeNotifications.ts
export function useRealtimeNotifications() {
	const { profile } = useAuth();
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	useEffect(() => {
		if (!profile) return;

		const channel = supabase
			.channel(`notif:${profile.id}`)
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'query_notifications',
					filter: `recipient_id=eq.${profile.id}`,
				},
				(payload) => {
					const notif = payload.new;
					// Invalidate count + list
					queryClient.invalidateQueries({ queryKey: ['notifications'] });
					queryClient.invalidateQueries({ queryKey: ['queries'] });

					// Show toast if it's a new_query for admin
					if (
						notif.notification_type === 'new_query' &&
						profile.role === 'admin'
					) {
						showNewQueryToast(notif, navigate);
					}
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [profile?.id]);
}
```

### ⚠️ Realtime Cleanup is Critical

- Always return cleanup from `useEffect`
- Use one channel per page lifecycle (not per render)
- Test by opening/closing tabs rapidly — no channels should leak (verify in Supabase Dashboard → Realtime)

### Where to Call

Mount `useRealtimeNotifications()` once in `AdminLayout` and once in `EmployeeLayout` — never deeper.

### Acceptance Criteria

- [ ] Open two browser windows (admin + employee). Employee submits query → admin sees toast within 2 seconds.
- [ ] Admin replies → employee notification bell badge increments without page reload
- [ ] No duplicate notifications
- [ ] No console warnings about leaked subscriptions
- [ ] Supabase Realtime dashboard shows clean connection lifecycle

---

# Phase 10 — Polish, Animations, Accessibility

**Goal:** Final pass for quality.

### Tasks

- [ ] All hover states present and smooth
- [ ] Loading skeletons for all data fetches (no raw spinners)
- [ ] All buttons have focus rings (`focus-visible:ring-2 focus-visible:ring-blue-500`)
- [ ] Tab order makes sense on every page
- [ ] Modals trap focus
- [ ] Esc closes modals/drawers
- [ ] ARIA labels on all icon-only buttons
- [ ] Screen reader announcements for status changes (use `aria-live="polite"` on timeline)
- [ ] Print stylesheet (optional)
- [ ] Mobile breakpoints tested at 360px, 768px, 1024px
- [ ] Dark mode not required for V1 — confirm light mode only

### Acceptance Criteria

- [ ] Lighthouse Accessibility score ≥ 95
- [ ] No console warnings during normal use
- [ ] Animations don't trigger layout thrashing (test with DevTools Performance)

---

# Phase 11 — Testing Checklist

**Goal:** Manual smoke tests before deploy.

### Auth & Routing

- [ ] Admin login → dashboard
- [ ] Employee login → /employee/queries
- [ ] Inactive employee → blocked
- [ ] Unknown email → blocked
- [ ] Employee tries `/dashboard` → redirected
- [ ] Admin tries `/employee/queries` → redirected

### Employee Flows

- [ ] Submit issue/fault query
- [ ] Submit new asset request
- [ ] Submit support query
- [ ] Edit pending query before admin replies → works
- [ ] Edit pending query after admin reply → blocked (no menu)
- [ ] Delete pending query → cascades correctly
- [ ] Reply on timeline → admin notified
- [ ] Notification bell shows updates from admin

### Admin Flows

- [ ] See all queries
- [ ] Filter by status + priority + type combined
- [ ] Open query → marks read for this admin only
- [ ] Other admins still see it as unread
- [ ] Change status pending → in_progress → resolved
- [ ] Reject with reason → reason appears in timeline
- [ ] Reply on timeline → employee notified
- [ ] Receive toast on new query (test with 2 browsers)
- [ ] Browser title updates with unread count

### Security

- [ ] In browser DevTools, try to call Supabase to update own role → fails
- [ ] In DevTools, try to read another employee's query → fails (RLS rejects)
- [ ] Inactive employee with cached session → forced sign-out on next nav

---

# Phase 12 — Deployment

### Steps

1. Final code review
2. Run `npm run build` locally → must succeed with no errors
3. Push branch, open PR to `main`
4. After merge, Vercel auto-deploys
5. **Soak test on production** with 2–3 invited employees for 48 hours
6. Send Slack announcement with:
   - What's new
   - How to access (https://assets.cogentlabs.co)
   - Slack/WhatsApp asset complaints are no longer monitored — use the portal
   - Who to contact for issues (you)
7. Monitor `query_activity_log` and Vercel logs for first 72 hours

### Rollback Plan

If anything goes seriously wrong post-deploy:

```bash
# In Vercel dashboard: redeploy previous production deployment
# In Supabase: keep migrations forward-only, but feature flag the routes:
# Add VITE_QUERIES_ENABLED=false to env → app falls back to admin-only mode
```

For a feature flag, wrap the new routes:

```typescript
{import.meta.env.VITE_QUERIES_ENABLED === 'true' && (
  <Route path="/queries" ... />
)}
```

---

# 📁 File Tree After Implementation

```
src/
├── components/
│   ├── layout/
│   │   ├── AdminLayout.tsx       (existing)
│   │   └── EmployeeLayout.tsx    (NEW)
│   ├── RoleGuard.tsx             (NEW)
│   ├── Sidebar.tsx               (modified - add Queries item)
│   ├── notifications/            (NEW)
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationModal.tsx
│   │   └── NotificationItem.tsx
│   └── queries/                  (NEW)
│       ├── StatusBadge.tsx
│       ├── PriorityBadge.tsx
│       ├── QueryTypePill.tsx
│       ├── QueryTimeline.tsx
│       ├── CommentComposer.tsx
│       ├── QueryForm.tsx
│       ├── AttachmentUploader.tsx
│       ├── AttachmentPreview.tsx
│       ├── EmptyState.tsx
│       └── QueryFiltersAdmin.tsx
├── features/
│   ├── auth/AuthProvider.tsx     (modified)
│   └── queries/                  (NEW)
│       └── QueryDetailAdminDrawer.tsx
├── hooks/
│   ├── useQueries.ts             (NEW)
│   ├── useQuery.ts               (NEW)
│   ├── useQueryMutations.ts      (NEW)
│   ├── useNotifications.ts       (NEW)
│   ├── useRealtimeNotifications.ts (NEW)
│   ├── useUnreadCount.ts         (NEW)
│   ├── useMyAssignedAssets.ts    (NEW)
│   └── useEmployeeCategories.ts  (NEW)
├── pages/
│   ├── CallbackPage.tsx          (modified)
│   ├── Unauthorized.tsx          (NEW)
│   ├── QueryListAdmin.tsx        (NEW)
│   ├── QueryDetailAdmin.tsx      (NEW)
│   ├── QueryListEmployee.tsx     (NEW)
│   ├── QueryDetailEmployee.tsx   (NEW)
│   └── NewQuery.tsx              (NEW)
├── types/
│   └── queries.ts                (NEW)
└── lib/
    ├── document-title.ts         (NEW)
    └── queries-constants.ts      (NEW)
```

---

# 🚦 Definition of Done

- [ ] All 12 phases complete with acceptance criteria met
- [ ] All manual tests in Phase 11 pass
- [ ] No console errors in production
- [ ] Lighthouse Accessibility ≥ 95
- [ ] At least 3 employees have submitted at least 1 query each via the portal
- [ ] At least 1 query has gone through full lifecycle: pending → in_progress → resolved with comments
- [ ] PRD updated with any deviations
- [ ] Changelog entry added to Keep Kaam PRD
- [ ] Demo video recorded (5 min) showing all key flows

---

**End of Implementation Plan**
