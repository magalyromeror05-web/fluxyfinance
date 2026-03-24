import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAdmin() {
  const { user } = useAuth();

  const { data: isAdmin, isLoading: loading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { isAdmin: isAdmin ?? false, loading };
}
