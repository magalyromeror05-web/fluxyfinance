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
import { TrendingUp, Target, Calendar, AlertTriangle, CheckCircle, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface ScenarioParams {
  income: number;
  expenses: number;
  investments: number;
  growthRate: number;
  inflationRate: number;
  currentWealth: number;
  months: number;
}

function projectScenario(p: ScenarioParams) {
  const monthlyGrowth = p.growthRate / 100 / 12;
  const monthlyInflation = p.inflationRate / 100 / 12;
  const data: { month: number; wealth: number; wealthWithInvestments: number }[] = [];
  let wealth = p.currentWealth;
  let investAccum = 0;
  let income = p.income;
  let expenses = p.expenses;
  let investments = p.investments;

  for (let m = 0; m <= p.months; m++) {
    data.push({
      month: m,
      wealth: Math.round(wealth),
      wealthWithInvestments: Math.round(wealth + investAccum),
    });
    income *= 1 + monthlyGrowth;
    expenses *= 1 + monthlyInflation;
    const saldo = income - expenses - investments;
    wealth += saldo;
    investAccum += investments;
    investments *= 1 + monthlyInflation; // investments grow with inflation
  }
  return data;
}

function findBreakeven(
  income: number,
  expenses: number,
  investments: number,
  growthRate: number,
  inflationRate: number,
): number | null {
  const mg = growthRate / 100 / 12;
  const mi = inflationRate / 100 / 12;
  let inc = income;
  let exp = expenses;
  let inv = investments;
  if (exp + inv <= inc) return null;
  for (let m = 1; m <= 60; m++) {
    inc *= 1 + mg;
    exp *= 1 + mi;
    inv *= 1 + mi;
    if (inc >= exp + inv) return m;
  }
  return null;
}

const fmt = (v: number) => formatCurrency(v, "BRL");

export default function Projection() {
  const { user } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();

  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [investments, setInvestments] = useState(0);
  const [growthRate, setGrowthRate] = useState(5);
  const [inflationRate, setInflationRate] = useState(6);
  const [wealth, setWealth] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Data quality flags
  const [hasIncome, setHasIncome] = useState(false);
  const [hasBudgets, setHasBudgets] = useState(false);
  const [budgetBreakdown, setBudgetBreakdown] = useState({ expenseCount: 0, investCount: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const now = new Date();
      const month = format(now, "yyyy-MM");

      const [profileRes, budgetsRes, categoriesRes] = await Promise.all([
        supabase.from("profiles").select("monthly_income_brl").eq("id", user.id).single(),
        supabase.from("budgets").select("amount, currency, category_id").eq("period_month", month).eq("currency", "BRL"),
        supabase.from("categories").select("id, type"),
      ]);

      // Income
      if (profileRes.data) {
        const inc = (profileRes.data as any).monthly_income_brl || 0;
        setIncome(inc);
        setHasIncome(inc > 0);
      }

      // Budgets split by category type
      if (budgetsRes.data && categoriesRes.data) {
        const catTypeMap = new Map<string, string>();
        (categoriesRes.data as any[]).forEach(c => catTypeMap.set(c.id, c.type));

        let expTotal = 0, invTotal = 0, expCount = 0, invCount = 0;
        for (const b of budgetsRes.data as any[]) {
          const catType = b.category_id ? catTypeMap.get(b.category_id) : "expense";
          if (catType === "investment") {
            invTotal += b.amount || 0;
            invCount++;
          } else {
            expTotal += b.amount || 0;
            expCount++;
          }
        }
        setExpenses(expTotal);
        setInvestments(invTotal);
        setHasBudgets(expCount + invCount > 0);
        setBudgetBreakdown({ expenseCount: expCount, investCount: invCount });
      }

      setLoaded(true);
    })();
  }, [user]);

  // BRL wealth from accounts (exclude investment type)
  useEffect(() => {
    if (!accountsLoading) {
      const brlTotal = accounts
        .filter((a) => a.currency === "BRL" && a.type !== "investment")
        .reduce((s, a) => s + a.balance, 0);
      setWealth(brlTotal);
    }
  }, [accounts, accountsLoading]);

  const MONTHS = 60;

  const chartData = useMemo(() => {
    if (income <= 0) return [];

    const optimistic = projectScenario({
      income, expenses, investments, months: MONTHS, currentWealth: wealth,
      growthRate: growthRate + 3,
      inflationRate: Math.max(0, inflationRate - 2),
    });
    const realistic = projectScenario({
      income, expenses, investments, months: MONTHS, currentWealth: wealth,
      growthRate, inflationRate,
    });
    const pessimistic = projectScenario({
      income, expenses, investments, months: MONTHS, currentWealth: wealth,
      growthRate: Math.max(0, growthRate - 2),
      inflationRate: inflationRate + 3,
    });

    return optimistic.map((_, i) => ({
      month: i,
      label: i % 12 === 0 ? `Ano ${i / 12}` : "",
      optimistic: optimistic[i].wealthWithInvestments,
      realistic: realistic[i].wealthWithInvestments,
      pessimistic: pessimistic[i].wealthWithInvestments,
      realisticLiquid: realistic[i].wealth,
    }));
  }, [income, expenses, investments, growthRate, inflationRate, wealth]);

  const realisticAt = (m: number) => chartData[m]?.realistic ?? 0;
  const realisticLiquidAt = (m: number) => chartData[m]?.realisticLiquid ?? 0;
  const breakeven = findBreakeven(income, expenses, investments, growthRate, inflationRate);

  // Total invested over 5 years (realistic)
  const totalInvested5y = useMemo(() => {
    let total = 0;
    let inv = investments;
    const mi = inflationRate / 100 / 12;
    for (let m = 0; m < 60; m++) {
      total += inv;
      inv *= 1 + mi;
    }
    return Math.round(total);
  }, [investments, inflationRate]);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Projeção Financeira</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Simule 3 cenários para os próximos 5 anos com base na sua renda, despesas e investimentos.
        </p>
      </div>

      {/* Data quality banner */}
      <div className={cn(
        "rounded-lg px-4 py-3 mb-6 flex items-center gap-2 text-sm",
        hasIncome && hasBudgets
          ? "bg-income/10 text-income"
          : "bg-amber-50 text-amber-700 border border-amber-200"
      )}>
        {hasIncome && hasBudgets ? (
          <>
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">✅ Projeção baseada nos seus dados reais de orçamento</span>
            <span className="text-xs ml-auto text-muted-foreground">
              {budgetBreakdown.expenseCount} despesa{budgetBreakdown.expenseCount !== 1 && "s"}
              {budgetBreakdown.investCount > 0 && ` · ${budgetBreakdown.investCount} aplicação(ões)`}
            </span>
          </>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">Dados incompletos — projeções podem ser imprecisas</span>
            </div>
            <div className="text-xs space-y-0.5 ml-6">
              {!hasIncome && <p>⚠️ Configure sua renda para projeções precisas</p>}
              {!hasBudgets && <p>⚠️ Crie orçamentos para calcular despesas automaticamente</p>}
            </div>
          </div>
        )}
      </div>

      {/* Configuration Card */}
      <Card className="mb-8">
        <CardContent className="p-5 space-y-5">
          <p className="text-sm font-semibold text-foreground">⚙️ Configuração</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Renda mensal líquida (BRL)</Label>
              <Input
                type="number"
                value={income || ""}
                onChange={(e) => { setIncome(parseFloat(e.target.value) || 0); setHasIncome((parseFloat(e.target.value) || 0) > 0); }}
                placeholder="Digite sua renda"
              />
              {!hasIncome && <p className="text-[10px] text-amber-600 mt-1">Configure em Orçamentos → Renda mensal</p>}
            </div>
            <div>
              <Label className="text-xs">Despesas fixas mensais (BRL)</Label>
              <Input
                type="number"
                value={expenses || ""}
                onChange={(e) => setExpenses(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-[10px] text-muted-foreground mt-1" title={`${budgetBreakdown.expenseCount} orçamento(s) de despesa`}>
                {hasBudgets ? `${fmt(expenses)} em ${budgetBreakdown.expenseCount} orçamento(s)` : "Soma de orçamentos do mês"}
              </p>
            </div>
            <div>
              <Label className="text-xs">Aplicações mensais (BRL)</Label>
              <Input
                type="number"
                value={investments || ""}
                onChange={(e) => setInvestments(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                {budgetBreakdown.investCount > 0
                  ? `${fmt(investments)} em ${budgetBreakdown.investCount} aplicação(ões)`
                  : "Categorias tipo investimento"
                }
              </p>
            </div>
            <div>
              <Label className="text-xs">Patrimônio atual (BRL)</Label>
              <Input
                type="number"
                value={wealth || ""}
                onChange={(e) => setWealth(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Soma dos saldos BRL (exceto invest.)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Crescimento de renda (% ao ano)</Label>
                <span className="text-xs font-semibold text-primary tabular-nums">{growthRate}%</span>
              </div>
              <Slider value={[growthRate]} onValueChange={(v) => setGrowthRate(v[0])} min={0} max={20} step={0.5} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span><span>20%</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Inflação / aumento de despesas (% ao ano)</Label>
                <span className="text-xs font-semibold text-destructive tabular-nums">{inflationRate}%</span>
              </div>
              <Slider value={[inflationRate]} onValueChange={(v) => setInflationRate(v[0])} min={0} max={15} step={0.5} />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span><span>15%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {income <= 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Configure sua renda mensal para ver a projeção.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground mb-4">📈 Projeção de patrimônio total — 5 anos</p>
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
                        name === "optimistic" ? "Otimista" : name === "realistic" ? "Realista (total)" : name === "pessimistic" ? "Pessimista" : "Realista (líquido)",
                      ]}
                    />
                    <Legend
                      formatter={(v: string) =>
                        v === "optimistic" ? "Otimista" : v === "realistic" ? "Total c/ invest." : v === "realisticLiquid" ? "Líquido" : "Pessimista"
                      }
                    />
                    <Line type="monotone" dataKey="optimistic" stroke="hsl(var(--income))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="realistic" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="realisticLiquid" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="pessimistic" stroke="hsl(var(--expense))" strokeWidth={2} dot={false} strokeDasharray="6 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Result Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground mb-1">Patrimônio em 1 ano</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{fmt(realisticAt(12))}</p>
                <p className="text-[10px] text-muted-foreground">Líquido: {fmt(realisticLiquidAt(12))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground mb-1">Patrimônio em 3 anos</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{fmt(realisticAt(36))}</p>
                <p className="text-[10px] text-muted-foreground">Líquido: {fmt(realisticLiquidAt(36))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-4 w-4 text-income mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground mb-1">Patrimônio em 5 anos</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{fmt(realisticAt(60))}</p>
                <p className="text-[10px] text-muted-foreground">Líquido: {fmt(realisticLiquidAt(60))}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <PiggyBank className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-[11px] text-muted-foreground mb-1">Total investido em 5 anos</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{fmt(totalInvested5y)}</p>
                <p className="text-[10px] text-muted-foreground">{fmt(investments)}/mês</p>
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
                  {breakeven ? "Renda ≥ despesas + aplicações" : "Renda já cobre tudo"}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
