# PROJECT_CONTEXT.md

> **Single source of truth for Claude Code.** Read this first, every session, before touching any code.

---

## 1. What This Project Is

**Cogent Assets** is an internal asset management portal for Cogent Labs. It tracks every laptop, monitor, chair, AC, solar panel, security camera, and miscellaneous office asset across the company. Built originally as **admin-only** — only company admins (`@cogentlabs.co` Google accounts with role `admin`) can sign in and manage data.

We are **currently extending it** to a **two-sided platform**:

- **Admins** continue to use the existing dashboard (`/dashboard`, `/assets`, `/repair`, `/users`, `/summary`, `/settings`) and gain a new **Queries** tab.
- **Employees** (existing `@cogentlabs.co` accounts already in `profiles` with role `employee`) get a brand new portal at `/employee/queries` to raise asset issues, request new assets, and ask for support.

The new module is called the **User Queries Module**. Full spec lives in the PRD:
https://docs.google.com/document/d/1WfFyOBBlHV6_Dc0Abi0K62LxL5ZR995JsIByr8McGdc/edit?tab=t.kifr9feek6kd

---

## 2. Live Environment

| Property       | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Production URL | https://assets.cogentlabs.co                            |
| Hosting        | Vercel (auto-deploys from `main` branch)                |
| Repo           | `aizaz-js/Assets-Management`                            |
| Database       | Supabase (project ref `acxqgxsvyhctquthfack`)           |
| Storage        | Supabase Storage — bucket `asset-files` (existing)      |
| Auth           | Google OAuth 2.0, domain-restricted to `@cogentlabs.co` |
| Domain         | GoDaddy → Vercel CNAME                                  |
| Local dev port | 3000                                                    |

---

## 3. Tech Stack

| Layer        | Choice                                                |
| ------------ | ----------------------------------------------------- |
| Frontend     | React 18 + Vite + TypeScript                          |
| Styling      | Tailwind CSS                                          |
| State / Data | React Query (TanStack Query)                          |
| Routing      | React Router v6                                       |
| Animation    | Framer Motion _(new dependency for queries module)_   |
| Toasts       | react-hot-toast _(new dependency for queries module)_ |
| Date utils   | date-fns _(new dependency for queries module)_        |
| Charts       | Recharts                                              |
| Backend      | Supabase (PostgreSQL 15 + Auth + Realtime + Storage)  |
| Deployment   | Vercel                                                |

---

## 4. Repository Structure

```
Assets-Management/
├── docs/                       ← context files for Claude Code (THIS FOLDER)
│   ├── PROJECT_CONTEXT.md      ← you are here
│   ├── IMPLEMENTATION_PLAN.md  ← the phased build plan
│   ├── DATABASE_MIGRATION.md   ← exact SQL to run on Supabase
│   ├── UI_GUIDELINES.md        ← color palette, animations, patterns
│   └── PRD_REFERENCE.md        ← link + summary of the PRD
├── scripts/
│   └── migrations/             ← SQL migration files (versioned)
├── src/
│   ├── components/
│   │   ├── assets/             ← existing asset components
│   │   ├── queries/            ← NEW — query-related components
│   │   └── notifications/      ← NEW — notification components
│   ├── features/
│   │   ├── assets/             ← existing
│   │   ├── repair/             ← existing
│   │   ├── auth/               ← existing — modify for role routing
│   │   └── queries/            ← NEW
│   ├── hooks/
│   │   ├── useAssets.ts        ← existing
│   │   ├── useAssetFiles.ts    ← existing
│   │   ├── useRepairs.ts       ← existing
│   │   ├── useManufacturers.ts ← existing
│   │   ├── useDashboardStats.ts ← existing
│   │   ├── useQueries.ts       ← NEW
│   │   ├── useQuery.ts         ← NEW (note: collides with React Query's `useQuery`, alias the import)
│   │   ├── useQueryMutations.ts ← NEW
│   │   ├── useNotifications.ts ← NEW
│   │   ├── useRealtimeNotifications.ts ← NEW
│   │   ├── useUnreadCount.ts   ← NEW
│   │   ├── useMyAssignedAssets.ts ← NEW
│   │   └── useEmployeeCategories.ts ← NEW
│   ├── pages/
│   │   ├── Dashboard.tsx       ← existing — admin
│   │   ├── Assets.tsx          ← existing — admin
│   │   ├── Repair.tsx          ← existing — admin
│   │   ├── Users.tsx           ← existing — admin
│   │   ├── Summary.tsx         ← existing — admin
│   │   ├── Settings.tsx        ← existing — admin
│   │   ├── QueryListAdmin.tsx  ← NEW — admin
│   │   ├── QueryDetailAdmin.tsx ← NEW — admin
│   │   ├── QueryListEmployee.tsx ← NEW — employee
│   │   ├── QueryDetailEmployee.tsx ← NEW — employee
│   │   ├── NewQuery.tsx        ← NEW — employee
│   │   └── Unauthorized.tsx    ← NEW
│   ├── lib/
│   │   ├── supabase.ts         ← existing
│   │   ├── constants.ts        ← existing
│   │   ├── utils.ts            ← existing
│   │   ├── document-title.ts   ← NEW
│   │   └── queries-constants.ts ← NEW
│   └── types/
│       └── queries.ts          ← NEW
├── vite.config.ts              ← port 3000
└── .env.local                  ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

---

## 5. Database Schema (Current State)

### Existing tables that the queries module touches

#### `profiles` (RLS now ENABLED — fixed in current session)

- `id uuid` — must match `auth.users.id`
- `name text`
- `email text` — `@cogentlabs.co`
- `role text` — `admin` or `employee`
- `designation text`
- `status text` — `active` or `inactive`

**Important:** Until June 2026, `profiles` had RLS **disabled** to avoid recursion. We re-enabled it using `SECURITY DEFINER` helper functions. Helper functions: `public.is_admin(uuid)`, `public.get_my_role()`, `public.get_my_status()`.

#### `assets`

Primary asset table. Relevant columns for queries:

- `id uuid`
- `asset_tag text` — e.g. `LT-0042`
- `classification text` — `employee_allocated` or `company_allocated`
- `asset_type text` — slug like `laptop`, `chair`
- `manufacturer text`, `specs text`
- `status text` — `available`, `allotted`, `in_repair`, `retired`
- `allotted_user_id uuid` — FK to `profiles.id`
- Always JOIN to `profiles` for user display — never use deprecated `allotted_user_name` / `allotted_user_email` columns.

#### `asset_categories`

- `slug text` — used as `asset_queries.requested_category_slug` FK
- `classification text` — employees only see `employee_allocated` categories when requesting new assets

### New tables (added by the queries module)

See `/docs/DATABASE_MIGRATION.md` for full SQL. Summary:

| Table                 | Purpose                                                                  |
| --------------------- | ------------------------------------------------------------------------ |
| `asset_queries`       | One row per query submitted by an employee                               |
| `query_comments`      | Timeline messages — user replies + auto system events for status changes |
| `query_attachments`   | Reserved for future file upload feature — not used in V1                 |
| `query_notifications` | Per-recipient notification rows. Drive bell badge + toast                |
| `query_activity_log`  | Immutable audit log of every state change                                |

### Storage Buckets

- `asset-files` (existing) — for asset attachments
- `query-attachments` — **NOT created in V1** (file uploads deferred to V2)

---

## 6. RLS Model (How Security Works Here)

**Single most important principle:** RLS at the database is the **only real security boundary**. Frontend role checks and route guards are UX — they prevent confusion, not malice.

### What Stops Each Attack

| Attack                                                               | Stopped By                                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Employee modifies JS to render admin pages                           | Admin queries fail → empty UI, no leak                                |
| Employee tries direct Supabase call to set their own role to `admin` | `users_update_own_safe_fields` policy blocks role/status changes      |
| Employee tries to read another employee's queries                    | `employees_read_own_queries` filters by `auth.uid()`                  |
| Employee tries to write a query as someone else                      | `WITH CHECK (employee_id = auth.uid())`                               |
| Employee tries to mark their own query as resolved                   | `WITH CHECK (status = 'pending')` on update                           |
| Inactive user with stale session                                     | Frontend revalidates profile on every nav, force sign-out if inactive |
| Anonymous Supabase call                                              | No public policies — all rejected                                     |

### Frontend Hardening Rules

1. **Never trust** `useAuth().profile.role` as a security gate — only as a UX hint.
2. **Always revalidate** the profile from DB on each navigation, not just on login.
3. **Never store** role in localStorage or JWT custom claims as source of truth.
4. **Treat all user-supplied text** as untrusted. V1 is plain text only — no rich text. If we ever add markdown, sanitize with DOMPurify.

---

## 7. Conventions to Follow

### Naming

- React components: `PascalCase` files matching component name (`StatusBadge.tsx` exports `StatusBadge`)
- Hooks: `camelCase` starting with `use` (`useQueries.ts` exports `useQueries`)
- DB tables: `snake_case` (`asset_queries`, `query_comments`)
- DB columns: `snake_case`
- TS types/interfaces: `PascalCase`

### React Patterns

- Functional components only, no class components
- Custom hooks for all data fetching (never call `supabase` directly from components)
- React Query keys are arrays starting with the entity name: `['queries', filters]`, `['notifications', userId]`
- Mutations always `invalidateQueries` for the relevant key on success
- Never use `useState` for data that should come from the server — use React Query

### TypeScript

- No `any` types
- All Supabase responses typed via interfaces in `/src/types/`
- Prefer `interface` for object shapes, `type` for unions/aliases

### Styling

- Tailwind only. No CSS modules. No inline `style={}` except for dynamic values like animation properties.
- Color tokens: use the palette in `/docs/UI_GUIDELINES.md` — never invent new colors
- Spacing: stick to Tailwind defaults (`p-4`, `gap-6`, etc.) for consistency

### Animation

- Framer Motion only
- Standard durations: `0.15s` for small UI (toasts, dropdowns), `0.2s` for hover, `0.3s` for page-level
- Easing: `ease-out` for entering, `ease-in` for exiting
- `prefers-reduced-motion` respected — wrap large animations in a check

### Git

- Branch per feature: `feat/<thing>`, `fix/<thing>`, `chore/<thing>`
- Commit format: `feat(queries): phase 5 — employee portal list view`
- Squash on merge to `main`

---

## 8. Common Pitfalls (Things That Have Bitten Us)

1. **UUID mismatch on profiles** — Always create admins/employees by having them sign in **first** (so `auth.users` creates the row), then promoting their role. Never pre-create profiles with random UUIDs.
2. **RLS recursion on profiles** — Use `SECURITY DEFINER` helper functions like `public.is_admin()`. Never write a policy that queries `profiles` directly inside a `profiles` policy.
3. **Realtime channel leaks** — Always return cleanup from `useEffect`. Mount subscriptions in layout components only (one channel per session, not per render).
4. **Storage path collision** — Deferred, no file uploads in V1.
5. **Allotted user display** — Never use deprecated `allotted_user_name` columns. Always JOIN `profiles` via `allotted_user_id`.
6. **Asset categories `asset_type`** — This is a free text field (constraint was removed). Make sure inserts use a valid slug that exists in `asset_categories.slug`.

---

## 9. Active Admin Accounts (Reference Only)

| Name            | Email                        | Role          |
| --------------- | ---------------------------- | ------------- |
| Aizaz Sadaqat   | aizaz.sadaqat@cogentlabs.co  | admin (owner) |
| Ahmed Buksh     | ahmed.buksh@cogentlabs.co    | admin         |
| Ehmad Zubair    | ehmad@cogentlabs.co          | admin         |
| Rafia Sikander  | rafia.sikander@cogentlabs.co | admin         |
| Sher Ali        | sher@cogentlabs.co           | admin         |
| Syed Azim Iqbal | azim.iqbal@cogentlabs.co     | admin         |
| Waleed Ahmed    | waleed.ahmed@cogentlabs.co   | admin         |
| Waqar Ahmad     | waqar.ahmad@cogentlabs.co    | employee      |
| Noor Fatima     | noor.fatima@cogentlabs.co    | employee      |

---

## 10. Asset Tag Conventions

| Prefix | Category         | Classification |
| ------ | ---------------- | -------------- |
| LT-    | Laptop           | Employee       |
| MP-    | Mobile           | Employee       |
| CLED-  | Monitor          | Employee       |
| MSE-   | Mouse            | Employee       |
| KBD-   | Keyboard         | Employee       |
| IP-    | Tablet           | Employee       |
| CH-    | Chairs           | Company        |
| TB-    | Tables           | Company        |
| FN-    | Fans             | Company        |
| AC-    | Air Conditioners | Company        |
| SC-    | Security Cameras | Company        |
| SO-    | Solar Plates     | Company        |
| G-     | Glass / Windows  | Company        |
| PDR-   | Podcast Room     | Company        |

---

## 11. What's In Scope vs Out for the Current Build

### IN SCOPE (User Queries Module V1)

- Role-based routing (employee vs admin)
- Employee portal at `/employee/queries`
- Submit / edit / delete pending queries
- Three query types: issue/fault, new asset request, support/other
- ~~File attachments~~ — deferred to V2, plain text only in V1
- Linear comment timeline (GitHub Issues style)
- Status workflow: pending → in_progress → resolved / rejected
- Per-admin unread tracking
- Notification bell + modal + toast
- Supabase Realtime
- Full RLS

### OUT OF SCOPE (Defer to V1.1+)

- Email notifications
- Mobile native apps
- Bulk admin actions
- Assigning queries to specific admins
- SLA / escalation
- Reopen resolved queries
- File / image attachments (plain text only in V1)
- Virus scanning attachments
- Email digests

---

## 12. How Claude Code Should Approach This

1. **Always read this file first** at the start of every session.
2. Then read `/docs/IMPLEMENTATION_PLAN.md` to know which phase you're in.
3. Then read `/docs/UI_GUIDELINES.md` before writing any component.
4. Check the PRD link if there's any ambiguity.
5. When in doubt, **ask the user before writing code** that affects:
   - Database schema
   - RLS policies
   - Routing structure
   - Auth flow
6. After each phase, **explicitly state** which acceptance criteria are met and which aren't.
7. **Never skip phases** — they're ordered for a reason. DB before frontend. Shared components before pages. Realtime last.
8. After every code change, **run the dev server** and verify it compiles before declaring the task done.

---

**Last updated:** June 2026
**Maintainer:** Aizaz Sadaqat
