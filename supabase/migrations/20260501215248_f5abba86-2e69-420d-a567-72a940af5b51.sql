-- ============================================================
-- RESTORE COMPLETO DO SCHEMA (idempotente)
-- ============================================================

-- ---------- FUNÇÕES UTILITÁRIAS ----------
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id) $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ---------- PROFILES ----------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  avatar_url text,
  language varchar NOT NULL DEFAULT 'pt-BR',
  plan text NOT NULL DEFAULT 'free',
  onboarding_completed boolean NOT NULL DEFAULT false,
  tour_completed boolean NOT NULL DEFAULT false,
  monthly_income_brl numeric DEFAULT 0,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuário insere próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuário atualiza próprio perfil" ON public.profiles;
CREATE POLICY "Usuário lê próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuário insere próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuário atualiza próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- CONNECTIONS ----------
CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_type text NOT NULL,
  country text NOT NULL,
  status text NOT NULL DEFAULT 'connected',
  external_connection_id text,
  item_id text,
  logo text,
  accounts_count integer DEFAULT 0,
  consent_expires_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprias conexões" ON public.connections;
DROP POLICY IF EXISTS "Usuário cria próprias conexões" ON public.connections;
DROP POLICY IF EXISTS "Usuário atualiza próprias conexões" ON public.connections;
DROP POLICY IF EXISTS "Usuário deleta próprias conexões" ON public.connections;
CREATE POLICY "Usuário lê próprias conexões" ON public.connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprias conexões" ON public.connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprias conexões" ON public.connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprias conexões" ON public.connections FOR DELETE USING (auth.uid() = user_id);

-- ---------- ACCOUNTS ----------
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  connection_id uuid,
  provider_account_id text,
  account_name text NOT NULL,
  institution_name text NOT NULL,
  type text NOT NULL DEFAULT 'checking',
  currency text NOT NULL DEFAULT 'BRL',
  balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprias contas" ON public.accounts;
DROP POLICY IF EXISTS "Usuário cria próprias contas" ON public.accounts;
DROP POLICY IF EXISTS "Usuário atualiza próprias contas" ON public.accounts;
DROP POLICY IF EXISTS "Usuário deleta próprias contas" ON public.accounts;
CREATE POLICY "Usuário lê próprias contas" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprias contas" ON public.accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprias contas" ON public.accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprias contas" ON public.accounts FOR DELETE USING (auth.uid() = user_id);

-- ---------- CATEGORIES ----------
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  parent_id uuid,
  type text NOT NULL DEFAULT 'expense',
  icon text NOT NULL DEFAULT '📁',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprias categorias" ON public.categories;
DROP POLICY IF EXISTS "Usuário cria próprias categorias" ON public.categories;
DROP POLICY IF EXISTS "Usuário atualiza próprias categorias" ON public.categories;
DROP POLICY IF EXISTS "Usuário deleta próprias categorias" ON public.categories;
CREATE POLICY "Usuário lê próprias categorias" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprias categorias" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprias categorias" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprias categorias" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- ---------- TRANSACTIONS ----------
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid,
  connection_id uuid,
  external_transaction_id text,
  posted_at timestamptz NOT NULL DEFAULT now(),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  merchant text NOT NULL,
  description_raw text,
  category_id text,
  category_source text NOT NULL DEFAULT 'manual',
  institution_name text,
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'posted',
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Usuário cria próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Usuário atualiza próprias transações" ON public.transactions;
DROP POLICY IF EXISTS "Usuário deleta próprias transações" ON public.transactions;
CREATE POLICY "Usuário lê próprias transações" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprias transações" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprias transações" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprias transações" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- RULES ----------
CREATE TABLE IF NOT EXISTS public.rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  match_type text NOT NULL,
  match_value text NOT NULL,
  category_id uuid,
  priority integer DEFAULT 0,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprias regras" ON public.rules;
DROP POLICY IF EXISTS "Usuário cria próprias regras" ON public.rules;
DROP POLICY IF EXISTS "Usuário atualiza próprias regras" ON public.rules;
DROP POLICY IF EXISTS "Usuário deleta próprias regras" ON public.rules;
CREATE POLICY "Usuário lê próprias regras" ON public.rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprias regras" ON public.rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprias regras" ON public.rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprias regras" ON public.rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- BUDGETS ----------
CREATE TABLE IF NOT EXISTS public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category_id text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  period text NOT NULL DEFAULT 'monthly',
  period_start_day integer NOT NULL DEFAULT 1,
  period_month text,
  is_recurring boolean NOT NULL DEFAULT false,
  healthy_pct numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprios orçamentos" ON public.budgets;
DROP POLICY IF EXISTS "Usuário cria próprios orçamentos" ON public.budgets;
DROP POLICY IF EXISTS "Usuário atualiza próprios orçamentos" ON public.budgets;
DROP POLICY IF EXISTS "Usuário deleta próprios orçamentos" ON public.budgets;
CREATE POLICY "Usuário lê próprios orçamentos" ON public.budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprios orçamentos" ON public.budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprios orçamentos" ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprios orçamentos" ON public.budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- GOALS ----------
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  target_date date,
  monthly_contribution numeric,
  linked_investment_id uuid,
  status text NOT NULL DEFAULT 'active',
  icon text DEFAULT '🎯',
  color text DEFAULT 'purple',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User reads own goals" ON public.goals;
DROP POLICY IF EXISTS "User creates own goals" ON public.goals;
DROP POLICY IF EXISTS "User updates own goals" ON public.goals;
DROP POLICY IF EXISTS "User deletes own goals" ON public.goals;
CREATE POLICY "User reads own goals" ON public.goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User creates own goals" ON public.goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own goals" ON public.goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User deletes own goals" ON public.goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- INVESTMENTS ----------
CREATE TABLE IF NOT EXISTS public.investments (
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
  is_emergency_fund boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User reads own investments" ON public.investments;
DROP POLICY IF EXISTS "User creates own investments" ON public.investments;
DROP POLICY IF EXISTS "User updates own investments" ON public.investments;
DROP POLICY IF EXISTS "User deletes own investments" ON public.investments;
CREATE POLICY "User reads own investments" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User creates own investments" ON public.investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own investments" ON public.investments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User deletes own investments" ON public.investments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- CONTRACTS ----------
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  lender text,
  principal_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  interest_rate numeric,
  rate_type text,
  installments integer,
  first_due_date date,
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprios contratos" ON public.contracts;
DROP POLICY IF EXISTS "Usuário cria próprios contratos" ON public.contracts;
DROP POLICY IF EXISTS "Usuário atualiza próprios contratos" ON public.contracts;
DROP POLICY IF EXISTS "Usuário deleta próprios contratos" ON public.contracts;
CREATE POLICY "Usuário lê próprios contratos" ON public.contracts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprios contratos" ON public.contracts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza próprios contratos" ON public.contracts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta próprios contratos" ON public.contracts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- CONTRACT_INSTALLMENTS ----------
CREATE TABLE IF NOT EXISTS public.contract_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL,
  number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  transaction_id uuid,
  status text DEFAULT 'pending'
);
ALTER TABLE public.contract_installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprias parcelas" ON public.contract_installments;
DROP POLICY IF EXISTS "Usuário cria próprias parcelas" ON public.contract_installments;
DROP POLICY IF EXISTS "Usuário atualiza próprias parcelas" ON public.contract_installments;
DROP POLICY IF EXISTS "Usuário deleta próprias parcelas" ON public.contract_installments;
CREATE POLICY "Usuário lê próprias parcelas" ON public.contract_installments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_installments.contract_id AND c.user_id = auth.uid()));
CREATE POLICY "Usuário cria próprias parcelas" ON public.contract_installments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_installments.contract_id AND c.user_id = auth.uid()));
CREATE POLICY "Usuário atualiza próprias parcelas" ON public.contract_installments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_installments.contract_id AND c.user_id = auth.uid()));
CREATE POLICY "Usuário deleta próprias parcelas" ON public.contract_installments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM contracts c WHERE c.id = contract_installments.contract_id AND c.user_id = auth.uid()));

-- ---------- SIMULATIONS ----------
CREATE TABLE IF NOT EXISTS public.simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  simulation_type text,
  currency text NOT NULL DEFAULT 'BRL',
  monthly_amount numeric NOT NULL,
  monthly_impact numeric,
  duration_type text DEFAULT 'indefinite',
  duration_value integer,
  horizon_months integer,
  category_id text,
  diagnosis text,
  metadata jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User reads own simulations" ON public.simulations;
DROP POLICY IF EXISTS "User creates own simulations" ON public.simulations;
DROP POLICY IF EXISTS "User updates own simulations" ON public.simulations;
DROP POLICY IF EXISTS "User deletes own simulations" ON public.simulations;
CREATE POLICY "User reads own simulations" ON public.simulations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User creates own simulations" ON public.simulations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own simulations" ON public.simulations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User deletes own simulations" ON public.simulations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  action_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User reads own notifications" ON public.notifications;
DROP POLICY IF EXISTS "User creates own notifications" ON public.notifications;
DROP POLICY IF EXISTS "User updates own notifications" ON public.notifications;
DROP POLICY IF EXISTS "User deletes own notifications" ON public.notifications;
CREATE POLICY "User reads own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User creates own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User deletes own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- SUPPORT_TICKETS ----------
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  message text NOT NULL,
  page_context text,
  status text NOT NULL DEFAULT 'aberto',
  admin_response text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprios tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Usuário cria próprios tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins leem todos os tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins atualizam tickets" ON public.support_tickets;
CREATE POLICY "Usuário lê próprios tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Usuário cria próprios tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins leem todos os tickets" ON public.support_tickets FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins atualizam tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- ---------- ERROR_LOGS ----------
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  error_message text NOT NULL,
  error_stack text,
  page text,
  severity text NOT NULL DEFAULT 'warning',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can insert error_logs" ON public.error_logs;
DROP POLICY IF EXISTS "Admins can read error_logs" ON public.error_logs;
CREATE POLICY "Authenticated users can insert error_logs" ON public.error_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can read error_logs" ON public.error_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- ---------- WAITLIST ----------
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  plan text NOT NULL DEFAULT 'pro',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can read waitlist" ON public.waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can read waitlist" ON public.waitlist FOR SELECT TO anon, authenticated USING (true);

-- ---------- EMAIL SYSTEM ----------
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  variables jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  last_edited_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can insert email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can update email_templates" ON public.email_templates;
DROP POLICY IF EXISTS "Admins can delete email_templates" ON public.email_templates;
CREATE POLICY "Admins can read email_templates" ON public.email_templates FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can insert email_templates" ON public.email_templates FOR INSERT TO authenticated WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can update email_templates" ON public.email_templates FOR UPDATE TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Admins can delete email_templates" ON public.email_templates FOR DELETE TO authenticated USING (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_id uuid,
  target text NOT NULL DEFAULT 'all',
  status text DEFAULT 'draft',
  scheduled_at timestamptz,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_by text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage email_campaigns" ON public.email_campaigns;
CREATE POLICY "Admins can manage email_campaigns" ON public.email_campaigns FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  recipient_email text NOT NULL,
  template_type text NOT NULL,
  subject text NOT NULL,
  status text DEFAULT 'sent',
  resend_id text,
  error_message text,
  metadata jsonb,
  sent_at timestamptz DEFAULT now()
);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can insert email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can read own email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admins can read all email_logs" ON public.email_logs;
CREATE POLICY "Authenticated can insert email_logs" ON public.email_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can read own email_logs" ON public.email_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can read all email_logs" ON public.email_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  template_name text NOT NULL,
  status text NOT NULL,
  message_id text,
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can insert send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can read send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can update send log" ON public.email_send_log;
CREATE POLICY "Service role can insert send log" ON public.email_send_log FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can read send log" ON public.email_send_log FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role can update send log" ON public.email_send_log FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.email_send_state (
  id integer PRIMARY KEY DEFAULT 1,
  send_delay_ms integer NOT NULL DEFAULT 200,
  batch_size integer NOT NULL DEFAULT 10,
  auth_email_ttl_minutes integer NOT NULL DEFAULT 15,
  transactional_email_ttl_minutes integer NOT NULL DEFAULT 60,
  retry_after_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.email_send_state (id) VALUES (1) ON CONFLICT DO NOTHING;
ALTER TABLE public.email_send_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;
CREATE POLICY "Service role can manage send state" ON public.email_send_state FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.email_unsubscribe_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_unsubscribe_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can insert tokens" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can read tokens" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can mark tokens as used" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role can insert tokens" ON public.email_unsubscribe_tokens FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can read tokens" ON public.email_unsubscribe_tokens FOR SELECT USING (auth.role() = 'service_role');
CREATE POLICY "Service role can mark tokens as used" ON public.email_unsubscribe_tokens FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.suppressed_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  reason text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suppressed_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role can insert suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Service role can insert suppressed emails" ON public.suppressed_emails FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can read suppressed emails" ON public.suppressed_emails FOR SELECT USING (auth.role() = 'service_role');

-- ---------- ADMIN RPCs ----------
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS SETOF profiles LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM public.profiles WHERE public.is_admin(auth.uid()) ORDER BY created_at DESC $$;

CREATE OR REPLACE FUNCTION public.admin_count_table(table_name text)
RETURNS bigint LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result bigint;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RETURN 0; END IF;
  EXECUTE format('SELECT count(*) FROM public.%I', table_name) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_count_user_table(table_name text, p_user_id uuid)
RETURNS bigint LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE result bigint;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN RETURN 0; END IF;
  EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1', table_name) INTO result USING p_user_id;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_count_active_goals(p_user_id uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT count(*) FROM public.goals WHERE user_id = p_user_id AND status = 'active' AND public.is_admin(auth.uid()) $$;

CREATE OR REPLACE FUNCTION public.admin_get_user_accounts(p_user_id uuid)
RETURNS SETOF accounts LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM public.accounts WHERE user_id = p_user_id AND public.is_admin(auth.uid()) $$;

CREATE OR REPLACE FUNCTION public.admin_get_user_transactions(p_user_id uuid, p_limit integer DEFAULT 10)
RETURNS SETOF transactions LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT * FROM public.transactions WHERE user_id = p_user_id AND public.is_admin(auth.uid()) ORDER BY posted_at DESC LIMIT p_limit $$;