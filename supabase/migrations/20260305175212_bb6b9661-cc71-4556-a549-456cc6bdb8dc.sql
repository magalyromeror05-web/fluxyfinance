
-- Categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense', 'transfer')),
  icon text NOT NULL DEFAULT '📁',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê próprias categorias" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprias categorias" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprias categorias" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprias categorias" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Add period_month to budgets for monthly instances (e.g. '2026-03')
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS period_month text;
-- is_recurring flag
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false;
