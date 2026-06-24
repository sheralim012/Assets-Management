# Cogent Assets

Production-grade IT Asset Management System for Cogent Labs. Admin-only internal tool.

## 1. Project Overview

Cogent Assets tracks all company IT assets — laptops, mobiles, monitors, peripherals, and office equipment — with full lifecycle management: procurement, assignment, repair tracking, retirement, and offboarding workflows.

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| State | React Query (server) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth — Google OAuth only |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| Deployment | Vercel |

## 3. Local Development Setup

```bash
cd cogent-assets
npm install

cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

npm run dev
```

App runs at `http://localhost:3000`

## 4. Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key — never the service role key |
| `VITE_ALLOWED_EMAIL_DOMAIN` | Email domain restriction (default: `cogentlabs.co`) |

**Never commit `.env.local`**. Only `.env.example` is tracked.

## 5. Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production. Auto-deploys to Vercel. Protected — PRs only. |
| `dev` | Staging / integration. All feature branches merge here first. |
| `feature/*` | Individual features. Branch from `dev`. Delete after merge. |
| `fix/*` | Bug fixes. Branch from `dev` (or `main` for hotfixes). |
| `hotfix/*` | Urgent production fixes. Branch from `main`. Merge to both `main` AND `dev`. |

PR title format: `[Feature] Add asset modal` / `[Fix] Auth callback domain check`

## 6. Data Migration Steps

To migrate from `CL___Office_Inventory.xlsx`:

1. Export Excel to JSON:
   ```bash
   # Use any xlsx-to-json tool, or the Node xlsx package
   ```

2. Run preparation script:
   ```bash
   npx ts-node scripts/prepare-import.ts --input data/inventory.json
   ```

3. Review files in `data/output/`:
   - `import-assets.csv` — all assets (laptops, mobiles, LEDs)
   - `import-employees.csv` — employee roster
   - `import-assignments.csv` — asset-to-user mappings

4. Upload `import-assets.csv` via the Import screen (`/import`)

5. Employee profiles auto-create on first Google login

6. After employees sign in, apply assignments via Supabase dashboard or script

**Note:** Passwords are automatically stripped from the Specs field by the preparation script.

## 7. Supabase Setup

### Authentication
1. **Authentication → Providers → Google** — enable and configure
2. Set **Site URL**: `https://assets.cogentlabs.co`
3. Add **Redirect URLs**:
   - `https://assets.cogentlabs.co/callback`
   - `http://localhost:3000/callback`

### Database
Run the full SQL migration (from the project spec) in **Supabase SQL Editor**. Creates:
- `profiles` — user accounts with roles
- `assets` — asset inventory  
- `repair_records` — repair tracking
- `asset_audit_log` — immutable audit trail
- `consumable_inventory` — consumables stock

All tables have RLS enabled. Audit log has no DELETE policy — immutable by design.

## 8. Deployment

1. Import `cogent-assets` repo to Vercel
2. Set environment variables matching `.env.example`
3. Set Production Branch to `main`
4. `dev` branch generates preview deployments automatically

`vercel.json` handles SPA routing — no server functions needed.
