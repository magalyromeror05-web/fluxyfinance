import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

const PAGE_SIZE = 20;

const planBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  free: { label: "Free", variant: "secondary" },
  pro: { label: "Pro", variant: "default" },
  pro_annual: { label: "Pro Anual", variant: "default" },
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any>(null);

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_get_all_profiles");
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let list = users ?? [];
    if (planFilter !== "all") list = list.filter((u: any) => (u.plan || "free") === planFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u: any) =>
        (u.full_name || "").toLowerCase().includes(q) || (u.id || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, planFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} usuários encontrados</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        {["all", "free", "pro", "pro_annual"].map(f => (
          <Button key={f} size="sm" variant={planFilter === f ? "default" : "outline"} onClick={() => { setPlanFilter(f); setPage(0); }}>
            {f === "all" ? "Todos" : planBadge[f]?.label ?? f}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium">Onboarding</th>
                <th className="px-4 py-3 font-medium">Último acesso</th>
                <th className="px-4 py-3 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((u: any) => {
                const plan = u.plan || "free";
                const badge = planBadge[plan] ?? planBadge.free;
                const initials = (u.full_name || "?").split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();
                return (
                  <tr key={u.id} className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setSelected(u)}>
                    <td className="px-4 py-3 flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">{initials}</div>
                      <div>
                        <p className="font-medium text-foreground">{u.full_name || "—"}</p>
                        <p className="text-muted-foreground text-[10px]">{u.id?.slice(0, 8)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                    <td className="px-4 py-3">{u.onboarding_completed ? "✅" : "❌"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.last_active_at ? format(new Date(u.last_active_at), "dd/MM/yyyy HH:mm") : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(u.created_at), "dd/MM/yyyy")}</td>
                  </tr>
                );
              })}
              {!paginated.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {selected && <UserDetailModal user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function UserDetailModal({ user, onClose }: { user: any; onClose: () => void }) {
  const userId = user.id;

  const { data: accounts } = useQuery({
    queryKey: ["admin-user-accounts", userId],
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_get_user_accounts", { p_user_id: userId });
      return data ?? [];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["admin-user-activity", userId],
    queryFn: async () => {
      const [txsRes, budgets, goals, sims, invs] = await Promise.all([
        supabase.rpc("admin_get_user_transactions", { p_user_id: userId, p_limit: 10 }),
        supabase.rpc("admin_count_user_table", { table_name: "budgets", p_user_id: userId }),
        supabase.rpc("admin_count_active_goals", { p_user_id: userId }),
        supabase.rpc("admin_count_user_table", { table_name: "simulations", p_user_id: userId }),
        supabase.rpc("admin_count_user_table", { table_name: "investments", p_user_id: userId }),
      ]);
      return {
        transactions: txsRes.data ?? [],
        budgets: Number(budgets.data ?? 0),
        goals: Number(goals.data ?? 0),
        simulations: Number(sims.data ?? 0),
        investments: Number(invs.data ?? 0),
      };
    },
  });

  const { data: errors } = useQuery({
    queryKey: ["admin-user-errors", userId],
    queryFn: async () => {
      const { data } = await supabase.from("error_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const plan = user.plan || "free";
  const badge = planBadge[plan] ?? planBadge.free;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user.full_name || "Usuário"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="perfil">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="contas">Contas</TabsTrigger>
            <TabsTrigger value="atividade">Atividade</TabsTrigger>
            <TabsTrigger value="erros">Erros</TabsTrigger>
          </TabsList>

          <TabsContent value="perfil" className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <Info label="Nome" value={user.full_name || "—"} />
              <Info label="ID" value={user.id?.slice(0, 12) + "…"} />
              <Info label="Plano" value={<Badge variant={badge.variant}>{badge.label}</Badge>} />
              <Info label="Renda mensal" value={user.monthly_income_brl ? `R$ ${Number(user.monthly_income_brl).toLocaleString("pt-BR")}` : "—"} />
              <Info label="Onboarding" value={user.onboarding_completed ? "Completo ✅" : "Pendente ❌"} />
              <Info label="Último acesso" value={user.last_active_at ? format(new Date(user.last_active_at), "dd/MM/yyyy HH:mm") : "—"} />
              <Info label="Cadastro" value={format(new Date(user.created_at), "dd/MM/yyyy HH:mm")} />
            </div>
          </TabsContent>

          <TabsContent value="contas" className="space-y-2 text-xs">
            {!accounts?.length ? <p className="text-muted-foreground">Nenhuma conta.</p> : (
              <table className="w-full">
                <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Instituição</th><th>Moeda</th><th>Saldo</th><th>Status</th></tr></thead>
                <tbody>
                  {accounts.map((a: any) => (
                    <tr key={a.id} className="border-b border-border"><td className="py-2">{a.institution_name}</td><td>{a.currency}</td><td>{Number(a.balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td><td>{a.status}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabsContent>

          <TabsContent value="atividade" className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <Info label="Orçamentos" value={activity?.budgets ?? 0} />
              <Info label="Metas ativas" value={activity?.goals ?? 0} />
              <Info label="Simulações" value={activity?.simulations ?? 0} />
              <Info label="Investimentos" value={activity?.investments ?? 0} />
            </div>
            <p className="text-sm font-medium mt-4">Últimas transações</p>
            {!activity?.transactions?.length ? <p className="text-muted-foreground">Nenhuma transação.</p> : (
              <table className="w-full">
                <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Data</th><th>Merchant</th><th>Valor</th></tr></thead>
                <tbody>
                  {activity.transactions.map((t: any) => (
                    <tr key={t.id} className="border-b border-border"><td className="py-1.5">{format(new Date(t.posted_at), "dd/MM")}</td><td>{t.merchant}</td><td className={Number(t.amount) < 0 ? "text-destructive" : "text-emerald-600"}>{Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabsContent>

          <TabsContent value="erros" className="text-xs space-y-2">
            {!errors?.length ? <p className="text-muted-foreground">Nenhum erro registrado.</p> : (
              errors.map((e: any) => (
                <div key={e.id} className="p-3 rounded-lg border border-border space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{format(new Date(e.created_at), "dd/MM HH:mm")}</span>
                    <Badge variant={e.severity === "critical" ? "destructive" : "secondary"}>{e.severity}</Badge>
                  </div>
                  <p className="text-foreground">{e.error_message}</p>
                  <p className="text-muted-foreground">{e.page}</p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}
