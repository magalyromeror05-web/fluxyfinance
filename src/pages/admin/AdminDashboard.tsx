import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, CreditCard, ArrowLeftRight, Calculator, Target, Landmark, AlertTriangle, CheckCircle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

function MetricCard({ title, value, icon: Icon, color = "text-primary" }: { title: string; value: string | number; icon: any; color?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`rounded-lg p-2 bg-muted ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString();
      const last24h = subDays(new Date(), 1).toISOString();

      const [profiles, accounts, transactions, simulations, goals, investments, errors] = await Promise.all([
        supabase.from("profiles").select("id, plan, last_active_at, onboarding_completed, created_at"),
        supabase.from("accounts").select("id", { count: "exact", head: true }),
        supabase.from("transactions").select("id", { count: "exact", head: true }),
        supabase.from("simulations").select("id", { count: "exact", head: true }),
        supabase.from("goals").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("investments").select("id", { count: "exact", head: true }),
        supabase.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", last24h),
      ]);

      const profilesList = profiles.data ?? [];
      const totalUsers = profilesList.length;
      const activeToday = profilesList.filter(p => p.last_active_at && p.last_active_at >= today).length;
      const freePlan = profilesList.filter(p => !p.plan || p.plan === "free").length;
      const proPlan = profilesList.filter(p => p.plan === "pro" || p.plan === "pro_annual").length;
      const onboardingDone = profilesList.filter(p => p.onboarding_completed).length;
      const onboardingPct = totalUsers > 0 ? Math.round((onboardingDone / totalUsers) * 100) : 0;

      // Signups per day last 30 days
      const last30 = subDays(new Date(), 30);
      const dailySignups: Record<string, number> = {};
      for (let i = 0; i < 30; i++) {
        const d = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
        dailySignups[d] = 0;
      }
      profilesList.forEach(p => {
        const d = p.created_at?.slice(0, 10);
        if (d && d in dailySignups) dailySignups[d]++;
      });
      const chartData = Object.entries(dailySignups).map(([date, count]) => ({
        date: format(new Date(date + "T12:00:00"), "dd/MM", { locale: ptBR }),
        count,
      }));

      return {
        totalUsers,
        activeToday,
        freePlan,
        proPlan,
        totalAccounts: accounts.count ?? 0,
        totalTransactions: transactions.count ?? 0,
        totalSimulations: simulations.count ?? 0,
        errorsLast24h: errors.count ?? 0,
        totalGoals: goals.count ?? 0,
        totalInvestments: investments.count ?? 0,
        onboardingPct,
        chartData,
      };
    },
    staleTime: 60_000,
  });

  const { data: recentErrors } = useQuery({
    queryKey: ["admin-recent-errors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    staleTime: 60_000,
  });

  const s = stats;

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visão geral</h1>
        <p className="text-sm text-muted-foreground">Métricas do Fluxy em tempo real</p>
      </div>

      {/* Row 1 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Usuários cadastrados" value={s?.totalUsers ?? "—"} icon={Users} />
        <MetricCard title="Ativos hoje" value={s?.activeToday ?? "—"} icon={CheckCircle} color="text-emerald-600" />
        <MetricCard title="Plano Free" value={s?.freePlan ?? "—"} icon={Users} color="text-muted-foreground" />
        <MetricCard title="Plano Pro" value={s?.proPlan ?? "—"} icon={Users} color="text-amber-600" />
      </div>

      {/* Row 2 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Contas" value={s?.totalAccounts ?? "—"} icon={CreditCard} />
        <MetricCard title="Transações" value={s?.totalTransactions ?? "—"} icon={ArrowLeftRight} />
        <MetricCard title="Simulações" value={s?.totalSimulations ?? "—"} icon={Calculator} />
        <MetricCard title="Erros (24h)" value={s?.errorsLast24h ?? "—"} icon={AlertTriangle} color="text-destructive" />
      </div>

      {/* Row 3 */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Metas ativas" value={s?.totalGoals ?? "—"} icon={Target} />
        <MetricCard title="Investimentos" value={s?.totalInvestments ?? "—"} icon={Landmark} />
        <MetricCard title="Onboarding completo" value={s ? `${s.onboardingPct}%` : "—"} icon={CheckCircle} color="text-emerald-600" />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Novos cadastros — últimos 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s?.chartData ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="count" name="Cadastros" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent errors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Últimos erros</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/logs")}>Ver todos</Button>
        </CardHeader>
        <CardContent>
          {!recentErrors?.length ? (
            <p className="text-sm text-muted-foreground">Nenhum erro registrado.</p>
          ) : (
            <div className="space-y-2">
              {recentErrors.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3 text-xs border-b border-border pb-2 last:border-0">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${e.severity === "critical" ? "bg-destructive" : e.severity === "warning" ? "bg-amber-500" : "bg-muted-foreground"}`} />
                  <span className="text-muted-foreground w-28 flex-shrink-0">
                    {format(new Date(e.created_at), "dd/MM HH:mm")}
                  </span>
                  <span className="text-muted-foreground w-24 flex-shrink-0 truncate">{e.page}</span>
                  <span className="text-foreground truncate">{e.error_message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
