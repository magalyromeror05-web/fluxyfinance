
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  category_id text, -- NULL means global budget for this currency
  name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'monthly', -- 'weekly', 'monthly', 'yearly'
  period_start_day integer NOT NULL DEFAULT 1, -- day of month/week to start
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê próprios orçamentos" ON public.budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprios orçamentos" ON public.budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprios orçamentos" ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprios orçamentos" ON public.budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);
