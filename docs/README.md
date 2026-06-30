# 📚 /docs — Documentation Index

This folder is the **single source of truth** for the User Queries Module build.
Claude Code (and any developer joining this project) should read these files in this exact order:

---

## Reading Order

| # | File | What's in it | Read when |
|---|---|---|---|
| 1 | [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | What the project is, tech stack, conventions, repo structure, security model | **First thing every session** |
| 2 | [PRD_REFERENCE.md](./PRD_REFERENCE.md) | Link to the authoritative PRD + summary | When you need spec answers |
| 3 | [UI_GUIDELINES.md](./UI_GUIDELINES.md) | Colors, typography, animation patterns, component snippets | Before writing any UI code |
| 4 | [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) | Exact SQL to run on Supabase, verification queries, rollback | Once, at Phase 1 |
| 5 | [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | 12-phase build plan with acceptance criteria | The build itself |

---

## Quick Start for Claude Code

If this is your first session in this repo, paste this into Claude Code:

> Read `/docs/PROJECT_CONTEXT.md`, `/docs/PRD_REFERENCE.md`, `/docs/UI_GUIDELINES.md`, `/docs/DATABASE_MIGRATION.md`, and `/docs/IMPLEMENTATION_PLAN.md` in that order. Then summarise what we're building, which phase we're on, and what the next concrete step is. Don't write any code yet — wait for my confirmation.

---

## Rules

1. **Never skip files.** They're written assuming each prior file has been read.
2. **PRD wins disputes.** If a doc here disagrees with the PRD, follow the PRD and flag the docs as needing update.
3. **Update docs as you go.** If you discover a constraint not documented here, add it to the right file in the same PR.
4. **Phase order is intentional.** Database → routing → shared layer → pages → notifications → realtime → polish. Don't reorder.

---

## File Owners

| File | Owner |
|---|---|
| All docs in this folder | Aizaz Sadaqat |

---

**Last updated:** June 2026
