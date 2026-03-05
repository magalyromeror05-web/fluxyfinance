
-- Add missing columns to connections
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS external_connection_id text;
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS last_sync_at timestamp with time zone;

-- Add missing columns to transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS connection_id uuid REFERENCES public.connections(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS external_transaction_id text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS raw jsonb;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'posted';

-- Unique constraint for deduplication
ALTER TABLE public.transactions ADD CONSTRAINT uq_provider_external_tx UNIQUE (source, external_transaction_id);
