import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/hooks/useSupabaseData";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/types/database";
import { TrendingUp, TrendingDown, Target, Calendar } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Projection engine ───
interface ScenarioParams {
  income: number;
  expenses: number;
  growthRate: number; // annual %
  inflationRate: number; // annual %
  currentWealth: number;
  months: number;
}

function projectScenario(p: ScenarioParams) {
  const monthlyGrowth = p.growthRate / 100 / 12;
  const monthlyInflation = p.inflationRate / 100 / 12;
  const data: { month: number; wealth: number }[] = [];
  let wealth = p.currentWealth;
  let income = p.income;
  let expenses = p.expenses;

  for (let m = 0; m <= p.months; m++) {
    data.push({ month: m, wealth: Math.round(wealth) });
    income *= 1 + monthlyGrowth;
    expenses *= 1 + monthlyInflation;
    wealth += income - expenses;
  }
  return data;
}

function findBreakeven(
  income: number,
  expenses: number,
  growthRate: number,
  inflationRate: number,
): number | null {
  const mg = growthRate / 100 / 12;
  const mi = inflationRate / 100 / 12;
  let inc = income;
  let exp = expenses;
  if (exp <= inc) return null; // already positive
  for (let m = 1; m <= 60; m++) {
    inc *= 1 + mg;
    exp *= 1 + mi;
    if (exp >= inc) continue;
    return m;
  }
  return null;
}

const fmt = (v: number) => formatCurrency(v, "BRL");

export default function Projection() {
  const { user } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();

  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [growthRate, setGrowthRate] = useState(5);
  const [inflationRate, setInflationRate] = useState(6);
  const [wealth, setWealth] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Load initial data
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("monthly_income_brl")
        .eq("id", user.id)
        .single();
      if (profile) {
        const inc = (profile as any).monthly_income_brl || 0;
        setIncome(inc);
      }

      // Sum budgets as proxy for fixed expenses (current month)
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const { data: budgets } = await supabase
        .from("budgets")
        .select("amount, currency")
        .eq("period_month", month)
        .eq("currency", "BRL");
      if (budgets) {
        const total = budgets.reduce((s, b) => s + (b.amount || 0), 0);
        setExpenses(total);
      }

      setLoaded(true);
    })();
  }, [user]);

  // Compute BRL wealth from accounts
  useEffect(() => {
    if (!accountsLoading) {
      const brlTotal = accounts
        .filter((a) => a.currency === "BRL")
        .reduce((s, a) => s + a.balance, 0);
      setWealth(brlTotal);
    }
  }, [accounts, accountsLoading]);

  // ─── Projections ───
  const MONTHS = 60;

  const chartData = useMemo(() => {
    if (income <= 0) return [];

    const optimistic = projectScenario({
      income, expenses, months: MONTHS, currentWealth: wealth,
      growthRate: growthRate + 3,
      inflationRate: Math.max(0, inflationRate - 2),
    });
    const realistic = projectScenario({
      income, expenses, months: MONTHS, currentWealth: wealth,
      growthRate,
      inflationRate,
    });
    const pessimistic = projectScenario({
      income, expenses, months: MONTHS, currentWealth: wealth,
      growthRate: Math.max(0, growthRate - 2),
      inflationRate: inflationRate + 3,
    });

    return optimistic.map((_, i) => {
      const year = (i / 12).toFixed(1);
      return {
        month: i,
        label: i % 12 === 0 ? `Ano ${i / 12}` : "",
        year: Number(year),
        optimistic: optimistic[i].wealth,
        realistic: realistic[i].wealth,
        pessimistic: pessimistic[i].wealth,
      };
    });
  }, [income, expenses, growthRate, inflationRate, wealth]);

  // Result cards (realistic)
  const realisticAt = (m: number) => chartData[m]?.realistic ?? 0;
  const breakeven = findBreakeven(income, expenses, growthRate, inflationRate);

  if (!loaded || accountsLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-64 rounded-xl mt-8" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Projeção Financeira</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simule 3 cenários para os próximos 5 anos com base na sua renda e despesas.
        </p>
      </div>

      {/* ─── Configuration Card ─── */}
      <Card className="mb-8">
        <CardContent className="p-5 space-y-5">
          <p className="text-sm font-semibold text-foreground">⚙️ Configuração</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Renda mensal líquida (BRL)</Label>
              <Input
                type="number"
                value={income || ""}
                onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="text-xs">Despesas fixas mensais (BRL)</Label>
              <Input
                type="number"
                value={expenses || ""}
                onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Soma de orçamentos + contratos</p>
            </div>
            <div>
              <Label className="text-xs">Patrimônio atual (BRL)</Label>
              <Input
                type="number"
                value={wealth || ""}
                onChange={(e) => setWealth(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Soma dos saldos em BRL</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Crescimento de renda (% ao ano)</Label>
                <span className="text-xs font-semibold text-primary tabular-nums">{growthRate}%</span>
              </div>
              <Slider
                value={[growthRate]}
                onValueChange={(v) => setGrowthRate(v[0])}
                min={0}
                max={20}
                step={0.5}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Inflação / aumento de despesas (% ao ano)</Label>
                <span className="text-xs font-semibold text-destructive tabular-nums">{inflationRate}%</span>
              </div>
              <Slider
                value={[inflationRate]}
                onValueChange={(v) => setInflationRate(v[0])}
                min={0}
                max={15}
                step={0.5}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span>15%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Chart ─── */}
      {income <= 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Configure sua renda mensal para ver a projeção.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground mb-4">📈 Projeção de patrimônio — 5 anos</p>
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.filter((_, i) => i % 3 === 0 || i === 60)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(m: number) => (m % 12 === 0 ? `Ano ${m / 12}` : "")}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      interval={3}
                    />
                    <YAxis
                      tickFormatter={(v: number) => {
                        if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                        if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
                        return String(v);
                      }}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelFormatter={(m: number) => `Mês ${m}`}
                      formatter={(value: number, name: string) => [
                        fmt(value),
                        name === "optimistic" ? "Otimista" : name === "realistic" ? "Realista" : "Pessimista",
                      ]}
                    />
                    <Legend
                      formatter={(v: string) =>
                        v === "optimistic" ? "Otimista" : v === "realistic" ? "Realista" : "Pessimista"
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="optimistic"
                      stroke="hsl(var(--income))"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="realistic"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="pessimistic"
                      stroke="hsl(var(--expense))"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="6 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* ─── Result Cards ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground mb-1">Patrimônio em 1 ano</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{fmt(realisticAt(12))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground mb-1">Patrimônio em 3 anos</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{fmt(realisticAt(36))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-4 w-4 text-income mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground mb-1">Patrimônio em 5 anos</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{fmt(realisticAt(60))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground mb-1">Ponto de equilíbrio</p>
                <p className="text-lg font-bold tabular-nums text-foreground">
                  {breakeven ? `Mês ${breakeven}` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {breakeven ? "Quando despesas = renda" : "Renda já cobre despesas"}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
