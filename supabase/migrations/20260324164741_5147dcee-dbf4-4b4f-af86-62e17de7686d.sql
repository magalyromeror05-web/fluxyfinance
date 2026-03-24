
-- Add accounts_count to connections
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS accounts_count integer DEFAULT 0;

-- Create rules table
CREATE TABLE IF NOT EXISTS public.rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  priority integer DEFAULT 0,
  match_type text NOT NULL,
  match_value text NOT NULL,
  category_id uuid REFERENCES public.categories(id),
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê próprias regras" ON public.rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprias regras" ON public.rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprias regras" ON public.rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprias regras" ON public.rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  principal_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  interest_rate numeric,
  rate_type text,
  installments integer,
  first_due_date date,
  lender text,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário lê próprios contratos" ON public.contracts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprios contratos" ON public.contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprios contratos" ON public.contracts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprios contratos" ON public.contracts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create contract_installments table
CREATE TABLE IF NOT EXISTS public.contract_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
  number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  transaction_id uuid REFERENCES public.transactions(id)
);

ALTER TABLE public.contract_installments ENABLE ROW LEVEL SECURITY;

-- RLS via join to contracts for user_id
CREATE POLICY "Usuário lê próprias parcelas" ON public.contract_installments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));
CREATE POLICY "Usuário cria próprias parcelas" ON public.contract_installments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));
CREATE POLICY "Usuário atualiza próprias parcelas" ON public.contract_installments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));
CREATE POLICY "Usuário deleta próprias parcelas" ON public.contract_installments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));

-- Add healthy_pct to budgets
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS healthy_pct numeric;
