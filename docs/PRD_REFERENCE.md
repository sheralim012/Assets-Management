# PRD_REFERENCE.md

> Quick reference to the authoritative Product Requirements Document for the User Queries Module.
> When in doubt, the PRD is the source of truth — this file is only a summary and link.

---

## 🔗 Source PRD

**Cogent Assets Management PRD — Module: User Queries**

https://docs.google.com/document/d/1WfFyOBBlHV6_Dc0Abi0K62LxL5ZR995JsIByr8McGdc/edit?tab=t.kifr9feek6kd

This document is part of the larger Cogent Assets Management PRD, in the tab named **`Module-User Queries`**.

---

## 📋 At-a-Glance Summary

| Aspect | Decision |
|---|---|
| **Module name** | User Queries Module |
| **Version** | V1.0 |
| **Date** | June 2026 |
| **Scope** | Extend admin-only Cogent Assets portal into a two-sided platform |
| **New routes** | `/employee/queries`, `/employee/queries/new`, `/employee/queries/:id`, `/queries`, `/queries/:id` |
| **Query types** | `issue_fault`, `new_asset_request`, `support_other` |
| **Statuses** | `pending` → `in_progress` → `resolved` / `rejected` |
| **Priority levels** | `low`, `medium`, `high`, `critical` |
| **Attachments** | Max 3 files per query, 10MB each, images + PDF only |
| **Comments** | Immutable once posted, plain text only |
| **Edit/Delete window** | Only while `pending` AND no admin reply exists |
| **Notification mechanism** | Supabase Realtime (free tier — 200 concurrent connections) |
| **Unread tracking** | Per-admin, marked read on opening that specific query |
| **Security** | Full RLS, defense-in-depth, frontend role = UX only |

---

## 🎯 Goals (Verbatim from PRD)

1. **Role-based access** — admins and employees see completely different applications under the same domain
2. **Zero trust at the API layer** — no client-side role check is the source of truth; every privilege is enforced at the database via RLS
3. **Self-service query submission** — employees can submit, edit (when pending), and delete (when pending) their own queries
4. **Admin inbox** — single tab showing all employee queries with priority, status, filters, and unread badges
5. **Real-time visibility** — admin sees a toast and unread badge update the instant a new query is submitted
6. **Conversational threading** — employees and admins exchange comments inline on each query
7. **Audit trail** — every status change and reply is captured immutably

---

## 🚫 Non-Goals for V1 (Verbatim from PRD)

- Email notifications (only in-app for V1)
- Mobile native apps
- Bulk actions on queries
- Query categorization beyond the three core types
- File uploads on individual comments
- Assigning queries to specific admins (all admins see all queries)
- SLA tracking or automated escalation

---

## 🔑 Key Functional Requirements

If you ever need to look up the source FR numbers, here's the map:

| FR Range | Topic |
|---|---|
| FR-AUTH-Q-01 to FR-AUTH-Q-07 | Authentication & Routing |
| FR-QUERY-01 to FR-QUERY-08 | Query Submission (Employee) |
| FR-QUERY-09 to FR-QUERY-12 | Query Editing & Deletion |
| FR-ADMIN-Q-01 to FR-ADMIN-Q-07 | Admin Query Management |
| FR-NOTIF-Q-01 to FR-NOTIF-Q-09 | Notifications |
| FR-LOG-Q-01 to FR-LOG-Q-04 | Activity Log |

Refer to the PRD for the full text of each requirement.

---

## 📊 Database Schema (Quick Reference)

The PRD § 6 defines five new tables. See `/docs/DATABASE_MIGRATION.md` for full DDL.

```
asset_queries           — main query table
query_comments          — timeline messages (user replies + system events)
query_attachments       — files attached to queries
query_notifications     — per-recipient notification rows
query_activity_log      — immutable audit log
```

Plus one new Storage bucket: `query-attachments`.

---

## 🛡️ Security Model (Quick Reference)

The PRD § 8 outlines a defense-in-depth model:

1. Google OAuth + domain restriction (`@cogentlabs.co`)
2. Profile gate (status check on every navigation)
3. Frontend router guards (`<RoleGuard>` — UX layer, not security)
4. **Row-Level Security** — the only real security boundary
5. Storage bucket policies (path-scoped to query_id)
6. SECURITY DEFINER helper functions

**Key threats neutralized:**
- Role escalation via DevTools → blocked by `users_update_own_safe_fields`
- Cross-employee data leaks → blocked by `employees_read_own_queries`
- Self-resolving own queries → blocked by `WITH CHECK (status = 'pending')`

---

## ❓ Open Questions (From PRD § 13)

These are deferred / out of V1 scope but worth tracking:

1. Should employees see admin OOO indicators? — Defer to V1.1
2. Should there be a "reopen" action for resolved queries? — Decide based on usage
3. Should attachments be virus-scanned? — Rely on Supabase default for V1
4. Should we send email digests of pending queries? — Out of V1 scope

---

## 📝 Where the PRD Lives

The PRD is the authoritative spec. If something here disagrees with the PRD, the PRD wins.

The PRD lives in Google Docs, in the doc titled "Cogent Assets Management PRD", under the tab **`Module-User Queries`**.

Direct link:
https://docs.google.com/document/d/1WfFyOBBlHV6_Dc0Abi0K62LxL5ZR995JsIByr8McGdc/edit?tab=t.kifr9feek6kd

---

## 🔄 Changelog Entry (for Keep Kaam parent PRD)

```
| June 2026 | Add User Queries module (NEW) to Cogent Assets: enable employee login with strict role-based routing; employees can submit asset issue reports, new asset requests, and support queries with priority and attachments; queries flow through pending → in_progress → resolved / rejected; admins receive real-time toast and notification badge on new queries via Supabase Realtime; per-admin unread tracking with notification modal; linear comment timeline (GitHub Issues style) for query conversations; employees can edit/delete only pending queries with no admin replies; full RLS enforcement at Supabase layer to prevent client-side role escalation; new tables: asset_queries, query_comments, query_attachments, query_notifications, query_activity_log; new storage bucket: query-attachments. | High | Replaces informal Slack/WhatsApp asset complaints with a structured, auditable, real-time system. Closes the employee feedback loop on asset-related issues. | Internal — Operations / Engineering |
```

---

**Last updated:** June 2026
