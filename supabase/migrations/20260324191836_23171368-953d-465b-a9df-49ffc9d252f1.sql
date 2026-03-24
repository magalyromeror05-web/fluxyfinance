
CREATE TABLE public.simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  monthly_amount numeric NOT NULL,
  duration_type text DEFAULT 'indefinite',
  duration_value integer,
  category_id text,
  metadata jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own simulations" ON public.simulations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User creates own simulations" ON public.simulations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own simulations" ON public.simulations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User deletes own simulations" ON public.simulations FOR DELETE TO authenticated USING (auth.uid() = user_id);
