import { useMemo } from "react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { CURRENCY_LABELS, formatCurrency } from "@/types/database";
import type { DbAccount, DbTransaction } from "@/types/database";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { CategorySourceBadge } from "@/components/CategorySourceBadge";
import { TrendingUp, TrendingDown, RefreshCw, Bell, AlertTriangle, Plus, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AiTipsCard } from "@/components/AiTipsCard";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import type { FinancialSnapshot } from "@/lib/aiTips";

function CurrencySection({
  currency,
  accounts,
  transactions,
  convert,
}: {
  currency: string;
  accounts: DbAccount[];
  transactions: DbTransaction[];
  convert: (amount: number, from: string, to: string) => number;
}) {
  const currencyAccounts = accounts.filter((a) => a.currency === currency);
  const currencyTxs = transactions.filter((t) => t.currency === currency);

  const balance = currencyAccounts.reduce((s, a) => s + a.balance, 0);
  const income = currencyTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = currencyTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const recentTxs = currencyTxs.slice(0, 3);
  const info = CURRENCY_LABELS[currency] || { flag: "🌐", name: currency, symbol: currency };

  const colorVar = currency === "BRL" ? "var(--brl)" : currency === "USD" ? "var(--usd)" : "var(--pyg)";

  return (
    <section className="fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-1 w-8 rounded-full" style={{ backgroundColor: `hsl(${colorVar})` }} />
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          {info.flag} {info.name}
        </span>
        <CurrencyBadge currency={currency as any} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="atlas-card p-5 col-span-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Saldo total</p>
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
            {formatCurrency(balance, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">{currencyAccounts.length} conta(s)</p>
          {currency !== "BRL" && (
            <p className="text-[10px] text-muted-foreground/70 mt-1">≈ {formatCurrency(convert(balance, currency, "BRL"), "BRL")} na cotação atual</p>
          )}
        </div>

        <div className="atlas-card p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">Entradas (mês)</p>
            <TrendingUp className="h-3.5 w-3.5 text-income" />
          </div>
          <p className="text-xl font-bold tabular-nums text-income">+{formatCurrency(income, currency)}</p>
        </div>

        <div className="atlas-card p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">Saídas (mês)</p>
            <TrendingDown className="h-3.5 w-3.5 text-expense" />
          </div>
          <p className="text-xl font-bold tabular-nums text-expense">-{formatCurrency(expenses, currency)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="atlas-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Eventos</p>
          </div>
          <p className="text-sm text-muted-foreground">Sem eventos este mês.</p>
        </div>

        <div className="atlas-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Últimas movimentações
          </p>
          {recentTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem movimentações.</p>
          ) : (
            <ul className="space-y-2.5">
              {recentTxs.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.merchant}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CategorySourceBadge source={tx.category_source as any} />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums flex-shrink-0",
                      tx.amount > 0 ? "text-income" : "text-expense"
                    )}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {formatCurrency(Math.abs(tx.amount), tx.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GoalsWidget({ userId }: { userId: string }) {
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", userId],
    queryFn: async () => {
      const { data } = await supabase.from("goals").select("*").eq("status", "active").order("created_at", { ascending: false }).limit(3);
      return data ?? [];
    },
    enabled: !!userId,
  });

  if (goals.length === 0) return null;

  return (
    <section className="fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Minhas Metas</span>
        </div>
        <Link to="/metas" className="text-xs text-primary hover:underline">Ver todas</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {goals.map((g: any) => {
          const pct = Number(g.target_amount) > 0 ? (Number(g.current_amount) / Number(g.target_amount)) * 100 : 0;
          return (
            <div key={g.id} className="atlas-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{g.icon || "🎯"}</span>
                <p className="text-sm font-medium text-foreground truncate">{g.title}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>{formatCurrency(Number(g.current_amount), g.currency)}</span>
                <span>{Math.min(pct, 100).toFixed(0)}%</span>
              </div>
              <Progress value={Math.min(pct, 100)} className="h-1.5" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { accounts, transactions, connections, loading } = useSupabaseData();

  const hasExpiring = connections.some((c) => c.status === "expiring");
  const currencies = [...new Set(accounts.map((a) => a.currency))];
  const lastSync = accounts.map((a) => a.last_sync_at).filter(Boolean).sort().reverse()[0];
  const syncLabel = lastSync
    ? new Date(lastSync).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })
    : null;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão por moeda para evitar confusão. Cada uma no seu lugar.
        </p>
      </div>

      {hasExpiring && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 fade-in">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Conexão expirando em breve</p>
            <p className="text-xs text-amber-700 mt-0.5">Reconecte para manter o sync.</p>
          </div>
        </div>
      )}

      {syncLabel && (
        <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" />
          <span>Última sincronização: {syncLabel} · Tudo certo — isso é só organização.</span>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : currencies.length === 0 ? (
        <div className="atlas-card p-10 text-center fade-in">
          <div className="text-4xl mb-4">🏦</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Adicione sua primeira conta para começar</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Cadastre suas contas bancárias ou carteiras digitais para ter uma visão completa das suas finanças.
          </p>
          <Link
            to="/contas"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Adicionar conta
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {currencies.map((currency) => (
            <CurrencySection key={currency} currency={currency} accounts={accounts} transactions={transactions} />
          ))}

          {user && <GoalsWidget userId={user.id} />}

          {user && transactions.length >= 5 && (
            <AiTipsSection transactions={transactions} userId={user.id} />
          )}
        </div>
      )}
    </div>
  );
}

function AiTipsSection({ transactions, userId }: { transactions: DbTransaction[]; userId: string }) {
  const snapshot = useMemo<FinancialSnapshot>(() => {
    const brlTxs = transactions.filter((t) => t.currency === "BRL");
    const income = brlTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = brlTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

    const catMap = new Map<string, number>();
    brlTxs.filter((t) => t.amount < 0).forEach((t) => {
      const cat = t.category_id || "Sem categoria";
      catMap.set(cat, (catMap.get(cat) || 0) + Math.abs(t.amount));
    });

    const topCategories = [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount, pct: income > 0 ? Math.round((amount / income) * 100) : 0 }));

    return {
      totalIncomeBRL: income,
      totalExpensesBRL: expenses,
      topCategories,
      budgetAlerts: [],
      savingsRate,
      currency: "BRL",
    };
  }, [transactions]);

  return <AiTipsCard snapshot={snapshot} userId={userId} />;
}
