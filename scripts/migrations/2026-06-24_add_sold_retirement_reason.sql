-- Allow "sold" as a retirement reason and store the sale price.
-- Run this in Supabase → SQL Editor.

-- 1. Add sale_price column if missing
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS sale_price numeric;

-- 2. Replace the CHECK constraint to include 'sold'
ALTER TABLE public.assets
  DROP CONSTRAINT IF EXISTS assets_retirement_reason_check;

ALTER TABLE public.assets
  ADD CONSTRAINT assets_retirement_reason_check
  CHECK (retirement_reason IN (
    'end_of_life', 'beyond_repair', 'replaced', 'stolen', 'lost', 'sold'
  ));

-- 3. Verify
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'assets_retirement_reason_check';
