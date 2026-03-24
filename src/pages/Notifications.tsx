import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck } from "lucide-react";

const TYPE_ICONS: Record<string, string> = {
  budget_alert: "🔴",
  connection_expiring: "🟡",
  goal_reached: "🏆",
  bill_due: "📅",
  monthly_summary: "📊",
  tip: "💡",
  system: "⚙️",
};

const TYPE_LABELS: Record<string, string> = {
  budget_alert: "Orçamento",
  connection_expiring: "Conexão",
  goal_reached: "Meta",
  bill_due: "Parcela",
  monthly_summary: "Resumo",
  tip: "Dica",
  system: "Sistema",
};

const FILTERS = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "Não lidas" },
  { value: "budget_alert", label: "Orçamento" },
  { value: "bill_due", label: "Parcelas" },
  { value: "connection_expiring", label: "Conexões" },
  { value: "tip", label: "Dicas" },
  { value: "system", label: "Sistema" },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  return `há ${Math.floor(days / 30)} mês(es)`;
}

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: allNotifications = [], isLoading } = useQuery({
    queryKey: ["notifications-all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const filtered = allNotifications.filter((n: any) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-all"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-all"] });
    },
  });

  const handleClick = (notif: any) => {
    if (!notif.read) markRead.mutate(notif.id);
    if (notif.action_url) navigate(notif.action_url);
  };

  const unreadCount = allNotifications.filter((n: any) => !n.read).length;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notificações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""}` : "Tudo em dia!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="h-4 w-4 mr-1" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground text-sm">Carregando...</p>
        ) : paginated.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground text-sm">Nenhuma notificação encontrada</p>
        ) : (
          paginated.map((n: any) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors flex gap-3 ${
                !n.read ? "bg-primary/5" : ""
              }`}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "📌"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className={`text-sm ${!n.read ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                    {n.title}
                  </p>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {TYPE_LABELS[n.type] ?? n.type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{n.message}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {page + 1} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
