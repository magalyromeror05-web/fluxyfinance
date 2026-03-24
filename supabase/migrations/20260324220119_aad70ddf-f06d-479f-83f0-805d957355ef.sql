
-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Create admins table
CREATE TABLE public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create is_admin helper function (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id)
$$;

-- RLS for admins: only admins can read
CREATE POLICY "Admins can read admins" ON public.admins
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create error_logs table
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message text NOT NULL,
  error_stack text,
  page text,
  severity text NOT NULL DEFAULT 'warning',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- RLS for error_logs: only admins can read
CREATE POLICY "Admins can read error_logs" ON public.error_logs
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- Anyone authenticated can insert error_logs (for logging errors)
CREATE POLICY "Authenticated users can insert error_logs" ON public.error_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
