
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  posted_at timestamp with time zone NOT NULL DEFAULT now(),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  description_raw text,
  merchant text NOT NULL,
  category_id text,
  category_source text NOT NULL DEFAULT 'manual',
  institution_name text,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê próprias transações" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprias transações" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprias transações" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprias transações" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);
