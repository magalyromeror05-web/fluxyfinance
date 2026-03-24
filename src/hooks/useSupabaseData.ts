import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { DbAccount, DbTransaction, DbConnection } from "@/types/database";
import { useEffect } from "react";

function useTrackActivity() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user?.id) return;
    const key = "fluxy_activity_updated";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user.id)
      .then(() => {});
  }, [user?.id]);
}

export function useAccounts() {
  const { user } = useAuth();
  return useQuery<DbAccount[]>({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbAccount[];
    },
    enabled: !!user,
  });
}

export function useTransactions(month?: string) {
  const { user } = useAuth();
  return useQuery<DbTransaction[]>({
    queryKey: ["transactions", user?.id, month],
    queryFn: async () => {
      const now = month ? new Date(month + "-01") : new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("posted_at", start)
        .lte("posted_at", end)
        .order("posted_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbTransaction[];
    },
    enabled: !!user,
  });
}

export function useConnections() {
  const { user } = useAuth();
  return useQuery<DbConnection[]>({
    queryKey: ["connections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbConnection[];
    },
    enabled: !!user,
  });
}

export function useSupabaseData() {
  useTrackActivity();
  const accounts = useAccounts();
  const transactions = useTransactions();
  const connections = useConnections();

  return {
    accounts: accounts.data ?? [],
    transactions: transactions.data ?? [],
    connections: connections.data ?? [],
    loading: accounts.isLoading || transactions.isLoading || connections.isLoading,
    error: accounts.error || transactions.error || connections.error,
  };
}
