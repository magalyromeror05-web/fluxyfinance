
CREATE TABLE public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  institution text,
  currency text NOT NULL DEFAULT 'BRL',
  invested_amount numeric NOT NULL,
  current_value numeric NOT NULL,
  expected_return_pct numeric,
  maturity_date date,
  notes text,
  is_emergency_fund boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User reads own investments" ON public.investments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User creates own investments" ON public.investments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User updates own investments" ON public.investments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User deletes own investments" ON public.investments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
