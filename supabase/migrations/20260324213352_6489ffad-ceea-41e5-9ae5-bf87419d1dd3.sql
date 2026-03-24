ALTER TABLE public.simulations 
  ADD COLUMN IF NOT EXISTS simulation_type text,
  ADD COLUMN IF NOT EXISTS monthly_impact numeric,
  ADD COLUMN IF NOT EXISTS diagnosis text,
  ADD COLUMN IF NOT EXISTS horizon_months integer;