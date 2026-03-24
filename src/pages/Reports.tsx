import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Download, ChevronDown, TrendingUp, TrendingDown, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Line, ComposedChart,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CHART_COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 56% 36%)",
  "hsl(35 90% 48%)", "hsl(340 75% 55%)", "hsl(200 80% 50%)", "hsl(var(--muted-foreground))",
];

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function getMonthOptions() {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    opts.push({ value: val, label: `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}` });
  }
  return opts;
}

function getDiagnosis(savingsRate: number, balance: number) {
  if (balance < 0) return { icon: "🔴", label: "Mês no vermelho", cls: "bg-destructive/10 text-destructive" };
  if (savingsRate < 10) return { icon: "⚠️", label: "Gastos acima da média", cls: "bg-amber-500/10 text-amber-700" };
  return { icon: "✅", label: "Mês equilibrado", cls: "bg-emerald-500/10 text-emerald-700" };
}

export default function Reports() {
  const { user } = useAuth();
  const monthOptions = useMemo(() => getMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [txTableOpen, setTxTableOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("all");

  const [year, month] = selectedMonth.split("-").map(Number);
  const monthStart = new Date(year, month - 1, 1).toISOString();
  const monthEnd = new Date(year, month, 0, 23, 59, 59).toISOString();
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStart = new Date(prevYear, prevMonth - 1, 1).toISOString();
  const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59).toISOString();

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["report-tx", user?.id, selectedMonth],
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("*")
        .gte("posted_at", monthStart).lte("posted_at", monthEnd)
        .order("posted_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: prevTransactions = [] } = useQuery({
    queryKey: ["report-tx-prev", user?.id, prevYear, prevMonth],
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("*")
        .gte("posted_at", prevStart).lte("posted_at", prevEnd);
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*");
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["report-budgets", user?.id, selectedMonth],
    queryFn: async () => {
      const { data } = await supabase.from("budgets").select("*");
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("goals").select("*").eq("status", "active");
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("accounts").select("*");
      return data ?? [];
    },
    enabled: !!user,
  });

  // Historical data for last 6 months
  const { data: historicalTx = [] } = useQuery({
    queryKey: ["report-historical", user?.id, selectedMonth],
    queryFn: async () => {
      const start6 = new Date(year, month - 7, 1).toISOString();
      const { data } = await supabase.from("transactions").select("posted_at,amount,currency")
        .gte("posted_at", start6).lte("posted_at", monthEnd);
      return data ?? [];
    },
    enabled: !!user,
  });

  const catMap = useMemo(() => new Map(categories.map((c: any) => [c.id, c])), [categories]);
  const accountMap = useMemo(() => new Map(accounts.map((a: any) => [a.id, a])), [accounts]);

  const stats = useMemo(() => {
    const income = transactions.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
    const expenses = transactions.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    const prevIncome = prevTransactions.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
    const prevExpenses = prevTransactions.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
    const expenseChange = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

    return { income, expenses, balance, savingsRate, prevExpenses, expenseChange };
  }, [transactions, prevTransactions]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter((t: any) => t.amount < 0).forEach((t: any) => {
      const catId = t.category_id || "uncategorized";
      map.set(catId, (map.get(catId) || 0) + Math.abs(t.amount));
    });
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const top6 = sorted.slice(0, 6);
    const othersTotal = sorted.slice(6).reduce((s, [, v]) => s + v, 0);
    const result = top6.map(([id, value]) => ({
      id,
      name: catMap.get(id)?.name ?? "Sem categoria",
      icon: catMap.get(id)?.icon ?? "📁",
      value,
      pct: stats.expenses > 0 ? (value / stats.expenses) * 100 : 0,
      incomePct: stats.income > 0 ? (value / stats.income) * 100 : 0,
    }));
    if (othersTotal > 0) {
      result.push({
        id: "others", name: "Outros", icon: "📦", value: othersTotal,
        pct: stats.expenses > 0 ? (othersTotal / stats.expenses) * 100 : 0,
        incomePct: stats.income > 0 ? (othersTotal / stats.income) * 100 : 0,
      });
    }
    return result;
  }, [transactions, catMap, stats]);

  // Budget vs Actual
  const budgetComparison = useMemo(() => {
    return categoryData.map((cat) => {
      const budget = budgets.find((b: any) => b.category_id === cat.id);
      const budgeted = budget ? Number(budget.amount) : 0;
      return { ...cat, budgeted, diff: cat.value - budgeted };
    });
  }, [categoryData, budgets]);

  // Historical chart data
  const historicalData = useMemo(() => {
    const months: { label: string; income: number; expenses: number; savings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const mStart = d.toISOString();
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const mTx = historicalTx.filter((t: any) => t.posted_at >= mStart && t.posted_at <= mEnd);
      const inc = mTx.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
      const exp = mTx.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
      months.push({ label: MONTHS_SHORT[d.getMonth()], income: inc, expenses: exp, savings: inc - exp });
    }
    return months;
  }, [historicalTx, year, month]);

  // Highlights
  const highlights = useMemo(() => {
    const biggest = categoryData[0];
    const mostControlled = budgetComparison.filter((c) => c.budgeted > 0).sort((a, b) => a.diff - b.diff)[0];
    const mostOver = budgetComparison.filter((c) => c.diff > 0 && c.budgeted > 0).sort((a, b) => b.diff - a.diff)[0];
    const savingsLabel = stats.savingsRate >= 20 ? "Excelente" : stats.savingsRate >= 10 ? "Boa" : stats.savingsRate >= 5 ? "Regular" : "Atenção";
    return { biggest, mostControlled, mostOver, savingsLabel };
  }, [categoryData, budgetComparison, stats]);

  const diagnosis = getDiagnosis(stats.savingsRate, stats.balance);
  const monthLabel = `${MONTHS_PT[month - 1]} ${year}`;

  // Export CSV
  function exportCSV() {
    const headers = ["Data", "Merchant", "Categoria", "Conta", "Moeda", "Valor", "Fonte"];
    const rows = transactions.map((t: any) => [
      new Date(t.posted_at).toLocaleDateString("pt-BR"),
      t.merchant,
      catMap.get(t.category_id)?.name ?? "—",
      accountMap.get(t.account_id)?.account_name ?? "—",
      t.currency,
      t.amount.toFixed(2),
      t.source,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fluxy-relatorio-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export PDF
  function exportPDF() {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Fluxy — Relatório Financeiro", 14, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(monthLabel, 14, 28);

    // Summary
    doc.setFontSize(10);
    let y = 38;
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Executivo", 14, y); y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Renda total: ${formatCurrency(stats.income, "BRL")}`, 14, y); y += 6;
    doc.text(`Total de despesas: ${formatCurrency(stats.expenses, "BRL")}`, 14, y); y += 6;
    doc.text(`Saldo do mês: ${formatCurrency(stats.balance, "BRL")}`, 14, y); y += 6;
    doc.text(`Taxa de poupança: ${stats.savingsRate.toFixed(1)}%`, 14, y); y += 6;
    doc.text(`Diagnóstico: ${diagnosis.icon} ${diagnosis.label}`, 14, y); y += 10;

    // Category table
    doc.setFont("helvetica", "bold");
    doc.text("Gastos por Categoria", 14, y); y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Categoria", "Orçado", "Realizado", "Diferença", "% Renda"]],
      body: budgetComparison.map((c) => [
        c.name,
        c.budgeted > 0 ? formatCurrency(c.budgeted, "BRL") : "—",
        formatCurrency(c.value, "BRL"),
        c.budgeted > 0 ? formatCurrency(c.diff, "BRL") : "—",
        `${c.incomePct.toFixed(1)}%`,
      ]),
      foot: [["Total", "", formatCurrency(stats.expenses, "BRL"), "", "100%"]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [100, 80, 160] },
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Highlights
    doc.setFont("helvetica", "bold");
    doc.text("Destaques do Mês", 14, y); y += 7;
    doc.setFont("helvetica", "normal");
    if (highlights.biggest) {
      doc.text(`Maior gasto: ${highlights.biggest.name} — ${formatCurrency(highlights.biggest.value, "BRL")}`, 14, y); y += 5;
    }
    doc.text(`Taxa de poupança: ${stats.savingsRate.toFixed(1)}% (${highlights.savingsLabel})`, 14, y); y += 10;

    // Transactions table
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text("Transações", 14, y); y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Data", "Merchant", "Categoria", "Valor"]],
      body: transactions.slice(0, 50).map((t: any) => [
        new Date(t.posted_at).toLocaleDateString("pt-BR"),
        t.merchant,
        catMap.get(t.category_id)?.name ?? "—",
        formatCurrency(t.amount, t.currency),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [100, 80, 160] },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(`Gerado pelo Fluxy em ${new Date().toLocaleDateString("pt-BR")} — Este relatório é meramente informativo`, 14, doc.internal.pageSize.getHeight() - 10);
    }

    doc.save(`fluxy-relatorio-${selectedMonth}.pdf`);
  }

  // Filtered transactions for table
  const filteredTx = catFilter === "all"
    ? transactions
    : transactions.filter((t: any) => t.category_id === catFilter);

  const uniqueCats = [...new Set(transactions.map((t: any) => t.category_id).filter(Boolean))];

  if (txLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" /> Relatórios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Seu histórico financeiro em detalhes</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={exportPDF} size="sm">
            <Download className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          <Button onClick={exportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </div>
      </div>

      {/* SECTION 1 — Executive Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Resumo — {monthLabel}</h2>
            <Badge className={cn("text-xs border", diagnosis.cls)}>{diagnosis.icon} {diagnosis.label}</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Renda</p>
              <p className="text-xl font-bold text-income">{formatCurrency(stats.income, "BRL")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Despesas</p>
              <p className="text-xl font-bold text-expense">{formatCurrency(stats.expenses, "BRL")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={cn("text-xl font-bold", stats.balance >= 0 ? "text-income" : "text-expense")}>
                {formatCurrency(stats.balance, "BRL")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa de poupança</p>
              <p className="text-xl font-bold text-foreground">{stats.savingsRate.toFixed(1)}%</p>
            </div>
          </div>
          {stats.prevExpenses > 0 && (
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
              {stats.expenseChange > 0 ? <TrendingUp className="h-3 w-3 text-expense" /> : <TrendingDown className="h-3 w-3 text-income" />}
              Você gastou {Math.abs(stats.expenseChange).toFixed(1)}% {stats.expenseChange > 0 ? "mais" : "menos"} que em {MONTHS_PT[prevMonth - 1]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2 — Where the money went */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Onde foi o dinheiro</h2>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sem despesas neste mês</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(v: number) => formatCurrency(v, "BRL")} />
                  <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Orçado vs Realizado</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-muted-foreground font-medium">Categoria</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Orçado</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Realizado</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">Diff</th>
                    <th className="text-right py-2 text-muted-foreground font-medium">% Renda</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetComparison.map((c) => (
                    <tr key={c.id} className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">{c.icon} {c.name}</td>
                      <td className="py-2 text-right text-muted-foreground">{c.budgeted > 0 ? formatCurrency(c.budgeted, "BRL") : "—"}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(c.value, "BRL")}</td>
                      <td className={cn("py-2 text-right font-medium", c.diff > 0 ? "text-expense" : "text-income")}>
                        {c.budgeted > 0 ? (c.diff > 0 ? "+" : "") + formatCurrency(c.diff, "BRL") : "—"}
                      </td>
                      <td className="py-2 text-right">{c.incomePct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="py-2">Total</td>
                    <td className="py-2 text-right">{formatCurrency(budgetComparison.reduce((s, c) => s + c.budgeted, 0), "BRL")}</td>
                    <td className="py-2 text-right">{formatCurrency(stats.expenses, "BRL")}</td>
                    <td></td>
                    <td className="py-2 text-right">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3 — Historical Comparison */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Comparativo — Últimos 6 meses</h2>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v, "BRL")} />
              <Bar dataKey="income" name="Renda" fill="hsl(142 56% 36%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savings" name="Poupança" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="expenses" stroke="hsl(var(--expense))" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* SECTION 4 — Highlights */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Destaques do mês</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highlights.biggest && (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <span className="text-lg">📈</span>
                <div>
                  <p className="text-xs text-muted-foreground">Maior gasto</p>
                  <p className="text-sm font-semibold text-foreground">{highlights.biggest.name} — {formatCurrency(highlights.biggest.value, "BRL")}</p>
                </div>
              </div>
            )}
            {highlights.mostControlled && highlights.mostControlled.diff < 0 && (
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <span className="text-lg">💡</span>
                <div>
                  <p className="text-xs text-muted-foreground">Mais controlada</p>
                  <p className="text-sm font-semibold text-foreground">{highlights.mostControlled.name} — {formatCurrency(Math.abs(highlights.mostControlled.diff), "BRL")} abaixo</p>
                </div>
              </div>
            )}
            {highlights.mostOver && (
              <div className="flex items-center gap-3 rounded-lg bg-destructive/5 p-3">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="text-xs text-muted-foreground">Estourou o orçamento</p>
                  <p className="text-sm font-semibold text-foreground">{highlights.mostOver.name} — +{formatCurrency(highlights.mostOver.diff, "BRL")}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <span className="text-lg">🏆</span>
              <div>
                <p className="text-xs text-muted-foreground">Taxa de poupança</p>
                <p className="text-sm font-semibold text-foreground">{stats.savingsRate.toFixed(1)}% — {highlights.savingsLabel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 5 — Transactions */}
      <Collapsible open={txTableOpen} onOpenChange={setTxTableOpen}>
        <Card>
          <CardContent className="p-6">
            <CollapsibleTrigger className="w-full flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                Transações do mês ({transactions.length})
              </h2>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", txTableOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex gap-2 mt-4 mb-3 flex-wrap">
                <button onClick={() => setCatFilter("all")}
                  className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    catFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  Todas
                </button>
                {uniqueCats.map((cid) => (
                  <button key={cid} onClick={() => setCatFilter(cid)}
                    className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      catFilter === cid ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    {catMap.get(cid)?.icon} {catMap.get(cid)?.name ?? "—"}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Data</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Merchant</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Categoria</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Conta</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTx.map((t: any) => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 text-muted-foreground">{new Date(t.posted_at).toLocaleDateString("pt-BR")}</td>
                        <td className="py-2 font-medium text-foreground">{t.merchant}</td>
                        <td className="py-2">{catMap.get(t.category_id)?.icon ?? "📁"} {catMap.get(t.category_id)?.name ?? "—"}</td>
                        <td className="py-2 text-muted-foreground">{accountMap.get(t.account_id)?.account_name ?? "—"}</td>
                        <td className={cn("py-2 text-right font-medium tabular-nums", t.amount > 0 ? "text-income" : "text-expense")}>
                          {t.amount > 0 ? "+" : ""}{formatCurrency(Math.abs(t.amount), t.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* SECTION 6 — Goals */}
      {goals.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
              <Target className="h-4 w-4" /> Metas ativas
            </h2>
            <div className="space-y-3">
              {goals.map((g: any) => {
                const pct = Number(g.target_amount) > 0 ? (Number(g.current_amount) / Number(g.target_amount)) * 100 : 0;
                return (
                  <div key={g.id} className="flex items-center gap-3">
                    <span className="text-lg">{g.icon || "🎯"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{g.title}</p>
                        <span className="text-xs text-muted-foreground">{Math.min(pct, 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatCurrency(Number(g.current_amount), g.currency)} / {formatCurrency(Number(g.target_amount), g.currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
