
-- Admin read-all functions using security definer

-- Get all profiles (admin only)
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles
  WHERE public.is_admin(auth.uid())
  ORDER BY created_at DESC
$$;

-- Count rows in a table (admin only)
CREATE OR REPLACE FUNCTION public.admin_count_table(table_name text)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result bigint;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN 0;
  END IF;
  
  EXECUTE format('SELECT count(*) FROM public.%I', table_name) INTO result;
  RETURN result;
END;
$$;

-- Admin get accounts for a specific user
CREATE OR REPLACE FUNCTION public.admin_get_user_accounts(p_user_id uuid)
RETURNS SETOF public.accounts
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.accounts
  WHERE user_id = p_user_id AND public.is_admin(auth.uid())
$$;

-- Admin get transactions for a specific user
CREATE OR REPLACE FUNCTION public.admin_get_user_transactions(p_user_id uuid, p_limit int DEFAULT 10)
RETURNS SETOF public.transactions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.transactions
  WHERE user_id = p_user_id AND public.is_admin(auth.uid())
  ORDER BY posted_at DESC
  LIMIT p_limit
$$;

-- Admin count for a specific user in a table
CREATE OR REPLACE FUNCTION public.admin_count_user_table(table_name text, p_user_id uuid)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result bigint;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN 0;
  END IF;
  
  EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1', table_name)
    INTO result USING p_user_id;
  RETURN result;
END;
$$;

-- Admin count with conditions
CREATE OR REPLACE FUNCTION public.admin_count_active_goals(p_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM public.goals
  WHERE user_id = p_user_id AND status = 'active' AND public.is_admin(auth.uid())
$$;
