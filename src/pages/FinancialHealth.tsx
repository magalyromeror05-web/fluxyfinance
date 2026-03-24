import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AiTipsCard } from "@/components/AiTipsCard";
import { cn } from "@/lib/utils";
import type { FinancialSnapshot } from "@/lib/aiTips";

function ScoreGauge({ score }: { score: number }) {
  const r = 80;
  const circumference = Math.PI * r; // half circle
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 91 ? "hsl(var(--income))" :
    score >= 71 ? "hsl(152 56% 36%)" :
    score >= 41 ? "hsl(35 90% 48%)" :
    "hsl(var(--expense))";

  const label =
    score >= 91 ? "Excelente" :
    score >= 71 ? "Bom" :
    score >= 41 ? "Regular" :
    "Atenção";

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background arc */}
        <path
          d="M 10 110 A 80 80 0 0 1 190 110"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 10 110 A 80 80 0 0 1 190 110"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <text x="100" y="95" textAnchor="middle" className="text-3xl font-bold" fill="currentColor" fontSize="36">
          {score}
        </text>
        <text x="100" y="115" textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="12">
          {label}
        </text>
      </svg>
    </div>
  );
}

function calcScore(
  savingsRate: number,
  budgetRespectedPct: number,
  currencyCount: number,
  accountsOkPct: number
) {
  // Savings (30%): 0% -> 0pts, 20%+ -> 30pts
  const savingsPts = Math.min(30, (Math.max(0, savingsRate) / 20) * 30);
  // Budgets (30%)
  const budgetPts = budgetRespectedPct * 30;
  // Diversification (20%): 1 currency -> 10pts, 2+ -> 20pts
  const diversPts = currencyCount >= 2 ? 20 : currencyCount === 1 ? 10 : 0;
  // Accounts synced (20%)
  const accountsPts = accountsOkPct * 20;

  return Math.round(savingsPts + budgetPts + diversPts + accountsPts);
}

export default function FinancialHealth() {
  const { user } = useAuth();
  const { accounts, transactions, connections, loading } = useSupabaseData();

  // Fetch investments and income for emergency fund metric
  const [emergencyFund, setEmergencyFund] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [invRes, profileRes, budgetsRes] = await Promise.all([
        supabase.from("investments").select("current_value, is_emergency_fund").eq("is_emergency_fund", true),
        supabase.from("profiles").select("monthly_income_brl").eq("id", user.id).single(),
        supabase.from("budgets").select("amount").eq("currency", "BRL"),
      ]);
      if (invRes.data) {
        setEmergencyFund((invRes.data as any[]).reduce((s, i) => s + (i.current_value || 0), 0));
      }
      if (profileRes.data) setMonthlyIncome((profileRes.data as any).monthly_income_brl || 0);
      if (budgetsRes.data) setMonthlyExpenses((budgetsRes.data as any[]).reduce((s, b) => s + (b.amount || 0), 0));
    })();
  }, [user]);

  const emergencyMonths = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : (monthlyIncome > 0 ? emergencyFund / monthlyIncome : 0);

  const { score, snapshot, breakdown } = useMemo(() => {
    const brlTxs = transactions.filter((t) => t.currency === "BRL");
    const income = brlTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = brlTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    const currencies = [...new Set(accounts.map((a) => a.currency))];
    const activeAccounts = accounts.filter((a) => a.status === "active");
    const accountsOkPct = accounts.length > 0 ? activeAccounts.length / accounts.length : 0;

    const catMap = new Map<string, number>();
    brlTxs
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const cat = t.category_id || "Sem categoria";
        catMap.set(cat, (catMap.get(cat) || 0) + Math.abs(t.amount));
      });

    const topCategories = [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        amount,
        pct: income > 0 ? Math.round((amount / income) * 100) : 0,
      }));

    const budgetRespectedPct = 1;
    const s = calcScore(savingsRate, budgetRespectedPct, currencies.length, accountsOkPct);

    const snap: FinancialSnapshot = {
      totalIncomeBRL: income,
      totalExpensesBRL: expenses,
      topCategories,
      budgetAlerts: [],
      savingsRate: Math.round(savingsRate),
      currency: "BRL",
    };

    return {
      score: s,
      snapshot: snap,
      breakdown: {
        savingsRate: Math.round(savingsRate),
        currencyCount: currencies.length,
        accountsOkPct: Math.round(accountsOkPct * 100),
      },
    };
  }, [accounts, transactions]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Saúde Financeira</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Score calculado com base na sua poupança, orçamentos, diversificação e contas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardContent className="p-6 flex flex-col items-center">
            <ScoreGauge score={score} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-sm font-semibold text-foreground">📊 Detalhamento</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Taxa de poupança</span>
                  <span className="font-semibold">{breakdown.savingsRate}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (breakdown.savingsRate / 20) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Moedas diversificadas</span>
                  <span className="font-semibold">{breakdown.currencyCount}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${breakdown.currencyCount >= 2 ? 100 : 50}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Contas ativas</span>
                  <span className="font-semibold">{breakdown.accountsOkPct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-income transition-all"
                    style={{ width: `${breakdown.accountsOkPct}%` }}
                  />
                </div>
              </div>

              {/* Emergency fund metric */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Reserva de emergência</span>
                  <span className={cn("font-semibold",
                    emergencyMonths >= 6 ? "text-income" : emergencyMonths >= 3 ? "text-amber-600" : "text-destructive"
                  )}>
                    {emergencyMonths.toFixed(1)} meses
                    {emergencyMonths >= 6 ? " 🟢" : emergencyMonths >= 3 ? " 🟡" : " 🔴"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      emergencyMonths >= 6 ? "bg-income" : emergencyMonths >= 3 ? "bg-amber-500" : "bg-destructive"
                    )}
                    style={{ width: `${Math.min((emergencyMonths / 6) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Ideal: 6 meses de despesas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {user && transactions.length >= 5 && (
        <AiTipsCard snapshot={snapshot} userId={user.id} />
      )}
    </div>
  );
}
