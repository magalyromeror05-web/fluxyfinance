import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { formatCurrency, type Currency } from "@/types/database";
import { BENCHMARK_GROUPS, getHealthyPercent } from "@/data/healthyBudget";
import { getBenchmarkTooltip } from "@/data/financialTips";
import { Plus, Pencil, Trash2, Target, Wallet, Copy, DollarSign, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { BudgetSpreadsheet } from "@/components/BudgetSpreadsheet";
import { TipBanner } from "@/components/TipBanner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, endOfMonth, addMonths, subMonths, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DbCategory {
  id: string; name: string; icon: string; type: string; parent_id: string | null;
}

interface Budget {
  id: string; user_id: string; currency: string; category_id: string | null;
  name: string; amount: number; period: string; period_start_day: number;
  period_month: string | null; is_recurring: boolean; healthy_pct: number | null;
  created_at: string; updated_at: string;
}

const currencies: Currency[] = ["BRL", "USD", "PYG"];

function getHealthColor(pct: number) {
  if (pct <= 85) return "bg-[hsl(var(--income))]";
  if (pct <= 100) return "bg-amber-500";
  return "bg-[hsl(var(--expense))]";
}

function getHealthTextColor(pct: number) {
  if (pct <= 85) return "text-income";
  if (pct <= 100) return "text-amber-600";
  return "text-destructive";
}

function getUsageColor(pct: number) {
  if (pct <= 85) return "bg-[hsl(var(--income))]";
  if (pct <= 100) return "bg-amber-500";
  return "bg-[hsl(var(--expense))]";
}

function getStatusBadge(pct: number) {
  if (pct <= 85) return { label: "✅ OK", cls: "text-income bg-income/10" };
  if (pct <= 100) return { label: "⚠️ Atenção", cls: "text-amber-600 bg-amber-50" };
  return { label: "🔴 Estourou", cls: "text-destructive bg-destructive/10" };
}

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<Currency | "ALL">("ALL");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [activeTab, setActiveTab] = useState("budgets");

  // Inline editing
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState("");

  // Income
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [incomeInput, setIncomeInput] = useState("");
  const [savingIncome, setSavingIncome] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [categoryId, setCategoryId] = useState<string>("global");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [recurMonths, setRecurMonths] = useState("3");
  const [healthyPct, setHealthyPct] = useState<string>("");

  const fetchAll = async () => {
    const [budgetsRes, categoriesRes, txRes, profileRes] = await Promise.all([
      supabase.from("budgets").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("created_at", { ascending: true }),
      supabase.from("transactions").select("*"),
      supabase.from("profiles").select("monthly_income_brl").eq("id", user!.id).single(),
    ]);
    if (budgetsRes.data) setBudgets(budgetsRes.data as Budget[]);
    if (categoriesRes.data) setCategories(categoriesRes.data as DbCategory[]);
    if (txRes.data) setTransactions(txRes.data);
    if (profileRes.data) {
      const income = (profileRes.data as any).monthly_income_brl || 0;
      setMonthlyIncome(income);
      setIncomeInput(income > 0 ? String(income) : "");
    }
    setLoading(false);
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  // Build hierarchical category list: parents first, then children indented
  const hierarchicalExpenseCategories = useMemo(() => {
    const parents = categories.filter(c => c.type === "expense" && !c.parent_id).sort((a, b) => a.name.localeCompare(b.name));
    const result: (DbCategory & { isChild: boolean })[] = [];
    for (const p of parents) {
      result.push({ ...p, isChild: false });
      const children = categories.filter(c => c.parent_id === p.id).sort((a, b) => a.name.localeCompare(b.name));
      for (const ch of children) {
        result.push({ ...ch, isChild: true });
      }
    }
    return result;
  }, [categories]);

  const parentCategoriesWithChildren = useMemo(() => {
    return new Set(categories.filter(c => c.parent_id).map(c => c.parent_id!));
  }, [categories]);

  const getSpentForBudget = (budget: Budget): number => {
    const catIds = budget.category_id
      ? [budget.category_id, ...categories.filter(c => c.parent_id === budget.category_id).map(c => c.id)]
      : categories.filter(c => c.type === "expense").map(c => c.id);

    const month = budget.period_month || selectedMonth;
    const monthDate = parse(month + "-01", "yyyy-MM-dd", new Date());
    const startDay = budget.period_start_day || 1;
    const periodStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), startDay);
    const periodEnd = startDay > 1
      ? new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, startDay - 1, 23, 59, 59)
      : endOfMonth(monthDate);

    return transactions
      .filter(t => {
        const txDate = new Date(t.posted_at);
        return t.currency === budget.currency
          && catIds.includes(t.category_id)
          && t.amount < 0
          && txDate >= periodStart
          && txDate <= periodEnd;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const saveIncome = async () => {
    const val = parseFloat(incomeInput) || 0;
    setSavingIncome(true);
    const { error } = await supabase
      .from("profiles")
      .update({ monthly_income_brl: val } as any)
      .eq("id", user!.id);
    setSavingIncome(false);
    if (error) { toast.error("Erro ao salvar renda"); return; }
    setMonthlyIncome(val);
    toast.success("Renda mensal atualizada");
  };

  const resetForm = () => {
    setName(""); setCurrency("BRL"); setCategoryId("global");
    setAmount(""); setIsRecurring(true); setRecurMonths("3"); setHealthyPct("");
    setEditingBudget(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (b: Budget) => {
    setEditingBudget(b); setName(b.name); setCurrency(b.currency as Currency);
    setCategoryId(b.category_id || "global"); setAmount(String(b.amount));
    setIsRecurring(b.is_recurring); setRecurMonths("1");
    setHealthyPct(b.healthy_pct ? String(b.healthy_pct) : "");
    setDialogOpen(true);
  };

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    if (catId !== "global") {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        const pct = getHealthyPercent(cat.name);
        if (pct !== undefined) {
          setHealthyPct(String(pct));
          if (monthlyIncome > 0 && !amount) setAmount(String(Math.round(monthlyIncome * pct / 100)));
        }
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !amount || Number(amount) <= 0) { toast.error("Preencha nome e valor"); return; }
    const hPct = healthyPct ? Number(healthyPct) : null;

    if (editingBudget) {
      const { error } = await supabase.from("budgets").update({
        name: name.trim(), currency, category_id: categoryId === "global" ? null : categoryId,
        amount: Number(amount), is_recurring: isRecurring, healthy_pct: hPct,
        updated_at: new Date().toISOString(),
      }).eq("id", editingBudget.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Orçamento atualizado");
    } else {
      const monthsToCreate = isRecurring ? Math.max(1, Number(recurMonths) || 1) : 1;
      const baseMonth = parse(selectedMonth + "-01", "yyyy-MM-dd", new Date());
      const rows = [];
      for (let i = 0; i < monthsToCreate; i++) {
        const m = addMonths(baseMonth, i);
        rows.push({
          user_id: user!.id, name: name.trim(), currency,
          category_id: categoryId === "global" ? null : categoryId,
          amount: Number(amount), period: "monthly", period_start_day: 1,
          period_month: format(m, "yyyy-MM"), is_recurring: isRecurring,
          healthy_pct: hPct, updated_at: new Date().toISOString(),
        });
      }
      const { error } = await supabase.from("budgets").insert(rows);
      if (error) { toast.error("Erro ao criar orçamento"); console.error(error); return; }
      toast.success(`${rows.length} orçamento(s) criado(s)`);
    }
    setDialogOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Orçamento excluído"); fetchAll();
  };

  const handleDuplicateToNextMonth = async (b: Budget) => {
    if (!b.period_month) return;
    const current = parse(b.period_month + "-01", "yyyy-MM-dd", new Date());
    const next = addMonths(current, 1);
    const nextMonth = format(next, "yyyy-MM");
    const exists = budgets.find(x => x.name === b.name && x.period_month === nextMonth && x.currency === b.currency);
    if (exists) { toast.info("Já existe orçamento para o próximo mês"); return; }

    const { error } = await supabase.from("budgets").insert({
      user_id: user!.id, name: b.name, currency: b.currency, category_id: b.category_id,
      amount: b.amount, period: "monthly", period_start_day: b.period_start_day,
      period_month: nextMonth, is_recurring: b.is_recurring, healthy_pct: b.healthy_pct,
      updated_at: new Date().toISOString(),
    });
    if (error) { toast.error("Erro ao duplicar"); return; }
    toast.success(`Orçamento duplicado para ${nextMonth}`); fetchAll();
  };

  const handleDuplicatePreviousMonth = async () => {
    const prevMonth = format(subMonths(parse(selectedMonth + "-01", "yyyy-MM-dd", new Date()), 1), "yyyy-MM");
    const prevBudgets = budgets.filter(b => b.period_month === prevMonth);
    if (prevBudgets.length === 0) { toast.info("Nenhum orçamento no mês anterior"); return; }

    const rows = prevBudgets.map(b => ({
      user_id: user!.id, name: b.name, currency: b.currency, category_id: b.category_id,
      amount: b.amount, period: "monthly", period_start_day: b.period_start_day,
      period_month: selectedMonth, is_recurring: b.is_recurring, healthy_pct: b.healthy_pct,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("budgets").insert(rows);
    if (error) { toast.error("Erro ao duplicar"); return; }
    toast.success("Orçamento duplicado! Revise os valores abaixo."); fetchAll();
  };

  const handleInlineSave = async (id: string) => {
    const val = parseFloat(inlineEditValue);
    if (!val || val <= 0) { setInlineEditId(null); return; }
    const { error } = await supabase.from("budgets").update({ amount: val, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    setInlineEditId(null); fetchAll();
  };

  // Duplicate all budgets from selectedMonth to next month
  const handleDuplicateToNextFromRealized = async () => {
    const currentBudgets = budgets.filter(b => b.period_month === selectedMonth);
    if (currentBudgets.length === 0) { toast.info("Nenhum orçamento neste mês"); return; }
    const nextMonth = format(addMonths(parse(selectedMonth + "-01", "yyyy-MM-dd", new Date()), 1), "yyyy-MM");
    const rows = currentBudgets.map(b => ({
      user_id: user!.id, name: b.name, currency: b.currency, category_id: b.category_id,
      amount: b.amount, period: "monthly", period_start_day: b.period_start_day,
      period_month: nextMonth, is_recurring: b.is_recurring, healthy_pct: b.healthy_pct,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("budgets").insert(rows);
    if (error) { toast.error("Erro ao duplicar"); return; }
    toast.success(`Orçamentos duplicados para ${getMonthLabel(nextMonth)}`); fetchAll();
  };

  // Filter budgets by selected month
  const monthBudgets = budgets.filter(b => {
    if (b.period_month && b.period_month !== selectedMonth) return false;
    if (filterCurrency !== "ALL" && b.currency !== filterCurrency) return false;
    return true;
  });

  const groupedByCurrency = currencies
    .filter(c => filterCurrency === "ALL" || c === filterCurrency)
    .map(cur => ({ currency: cur, items: monthBudgets.filter(b => b.currency === cur) }))
    .filter(g => g.items.length > 0);

  // Month options
  const monthOptions: string[] = [];
  for (let i = -6; i <= 6; i++) monthOptions.push(format(addMonths(new Date(), i), "yyyy-MM"));

  const getMonthLabel = (m: string) => {
    const d = parse(m + "-01", "yyyy-MM-dd", new Date());
    return format(d, "MMMM yyyy", { locale: ptBR });
  };

  // Health summary
  const brlBudgets = monthBudgets.filter(b => b.currency === "BRL");
  const overBudgetCategories = brlBudgets
    .filter(b => { if (!monthlyIncome || !b.healthy_pct) return false; return b.amount > monthlyIncome * b.healthy_pct / 100; })
    .map(b => b.name);

  const distributionData = brlBudgets
    .filter(b => b.category_id)
    .map(b => {
      const cat = categories.find(c => c.id === b.category_id);
      const pctOfIncome = monthlyIncome > 0 ? (b.amount / monthlyIncome) * 100 : 0;
      const idealPct = b.healthy_pct || (cat ? getHealthyPercent(cat.name) : undefined) || 0;
      return { name: b.name, icon: cat?.icon || "📁", pctOfIncome: Math.round(pctOfIncome), idealPct };
    });

  // ─── REALIZED TAB DATA ───
  const realizedData = useMemo(() => {
    const mBudgets = budgets.filter(b => b.period_month === selectedMonth);
    const monthDate = parse(selectedMonth + "-01", "yyyy-MM-dd", new Date());
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = endOfMonth(monthDate);

    const monthTx = transactions.filter(t => {
      const d = new Date(t.posted_at);
      return d >= monthStart && d <= monthEnd && t.amount < 0;
    });

    // Budgeted categories
    const budgeted = mBudgets.map(b => {
      const catIds = b.category_id
        ? [b.category_id, ...categories.filter(c => c.parent_id === b.category_id).map(c => c.id)]
        : [];
      const spent = monthTx
        .filter(t => t.currency === b.currency && catIds.includes(t.category_id))
        .reduce((s, t) => s + Math.abs(t.amount), 0);
      const cat = b.category_id ? categories.find(c => c.id === b.category_id) : null;
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      return {
        budgetId: b.id, name: b.name, currency: b.currency,
        budgeted: b.amount, spent, diff: b.amount - spent,
        pct, cat, status: getStatusBadge(pct),
      };
    });

    // Unbudgeted categories with spending
    const budgetedCatIds = new Set(mBudgets.filter(b => b.category_id).map(b => b.category_id!));
    const unbudgetedMap = new Map<string, { cat: DbCategory; spent: number; currency: string }>();
    monthTx.forEach(t => {
      if (t.category_id && !budgetedCatIds.has(t.category_id)) {
        const cat = categories.find(c => c.id === t.category_id);
        if (cat) {
          const key = `${t.category_id}-${t.currency}`;
          const existing = unbudgetedMap.get(key);
          if (existing) existing.spent += Math.abs(t.amount);
          else unbudgetedMap.set(key, { cat, spent: Math.abs(t.amount), currency: t.currency });
        }
      }
    });
    const unbudgeted = Array.from(unbudgetedMap.values());

    const totalBudgeted = budgeted.reduce((s, b) => s + b.budgeted, 0);
    const totalSpent = budgeted.reduce((s, b) => s + b.spent, 0);

    return { budgeted, unbudgeted, totalBudgeted, totalSpent };
  }, [budgets, transactions, categories, selectedMonth]);

  // History last 3 months
  const historyMonths = useMemo(() => {
    return [-3, -2, -1].map(offset => {
      const m = format(addMonths(parse(selectedMonth + "-01", "yyyy-MM-dd", new Date()), offset), "yyyy-MM");
      const mBudgets = budgets.filter(b => b.period_month === m);
      const monthDate = parse(m + "-01", "yyyy-MM-dd", new Date());
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = endOfMonth(monthDate);
      const monthTx = transactions.filter(t => {
        const d = new Date(t.posted_at);
        return d >= monthStart && d <= monthEnd && t.amount < 0;
      });

      let totalBudgeted = 0, totalSpent = 0;
      mBudgets.forEach(b => {
        totalBudgeted += b.amount;
        const catIds = b.category_id
          ? [b.category_id, ...categories.filter(c => c.parent_id === b.category_id).map(c => c.id)]
          : [];
        totalSpent += monthTx
          .filter(t => t.currency === b.currency && catIds.includes(t.category_id))
          .reduce((s, t) => s + Math.abs(t.amount), 0);
      });

      const adherence = totalBudgeted > 0 ? Math.round((1 - Math.max(0, totalSpent - totalBudgeted) / totalBudgeted) * 100) : 0;
      return { month: m, label: getMonthLabel(m), adherence, hasBudgets: mBudgets.length > 0 };
    });
  }, [budgets, transactions, categories, selectedMonth]);

  const totalDiff = realizedData.totalBudgeted - realizedData.totalSpent;
  const overallPct = realizedData.totalBudgeted > 0 ? (realizedData.totalSpent / realizedData.totalBudgeted) * 100 : 0;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Controle de gastos mensal por moeda e categoria.</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Novo Orçamento
        </Button>
      </div>

      <TipBanner page="orcamentos" userContext={{ overBudgetCategories: overBudgetCategories }} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="budgets">Orçamentos</TabsTrigger>
          <TabsTrigger value="spreadsheet">Planilha</TabsTrigger>
          <TabsTrigger value="realized">Realizado</TabsTrigger>
        </TabsList>

        {/* ════════════ TAB 1 — ORÇAMENTOS ════════════ */}
        <TabsContent value="budgets">
          {/* Income card */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Qual é sua renda mensal em BRL?</p>
                    <p className="text-[11px] text-muted-foreground">Usamos isso para calcular os % saudáveis.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="0.00" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} className="w-36" step={100} />
                  <Button size="sm" variant="outline" onClick={saveIncome} disabled={savingIncome}>
                    {savingIncome ? "..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distribution summary */}
          {monthlyIncome > 0 && distributionData.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-3">📊 Distribuição do seu orçamento</p>
                <div className="space-y-2.5">
                  {distributionData.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground font-medium">{d.icon} {d.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {d.pctOfIncome}% <span className="text-muted-foreground/60">/ ideal {d.idealPct}%</span>
                        </span>
                      </div>
                      <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                        {d.idealPct > 0 && (
                          <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/20 z-10" style={{ left: `${Math.min(d.idealPct, 100)}%` }} />
                        )}
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", d.idealPct > 0 ? getHealthColor((d.pctOfIncome / d.idealPct) * 100) : "bg-primary")}
                          style={{ width: `${Math.min(d.pctOfIncome, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs">
                  {overBudgetCategories.length === 0
                    ? <p className="text-income font-medium">✅ Sua distribuição está equilibrada</p>
                    : <p className="text-amber-600 font-medium">⚠️ {overBudgetCategories.join(", ")} {overBudgetCategories.length === 1 ? "está" : "estão"} acima do recomendado</p>
                  }
                </div>
              </CardContent>
            </Card>
          )}

          {/* Month selector + currency filter + duplicate button */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => <SelectItem key={m} value={m} className="capitalize">{getMonthLabel(m)}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-wrap">
              {(["ALL", "BRL", "USD", "PYG"] as const).map(f => (
                <button key={f} onClick={() => setFilterCurrency(f)} className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border",
                  filterCurrency === f ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
                )}>
                  {f === "ALL" ? "Todas" : f}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" className="gap-1.5 ml-auto" onClick={handleDuplicatePreviousMonth}>
              <Copy className="h-3.5 w-3.5" /> Duplicar mês anterior
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : monthBudgets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <Target className="h-12 w-12 text-muted-foreground/40" />
                <div className="text-center">
                  <p className="font-medium text-foreground">Nenhum orçamento para {getMonthLabel(selectedMonth)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Crie um orçamento para controlar seus gastos neste mês.</p>
                </div>
                <Button onClick={openCreate} size="sm" className="gap-2"><Plus className="h-4 w-4" /> Criar Orçamento</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {groupedByCurrency.map(({ currency: cur, items }) => (
                <div key={cur}>
                  <div className="flex items-center gap-2 mb-3">
                    <CurrencyBadge currency={cur} />
                    <span className="text-sm text-muted-foreground">{items.length} orçamento{items.length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="grid gap-3">
                    {items.map(b => {
                      const spent = getSpentForBudget(b);
                      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                      const clampedPct = Math.min(pct, 100);
                      const isOver = spent > b.amount;
                      const cat = b.category_id ? categories.find(c => c.id === b.category_id) : null;
                      const idealPct = b.healthy_pct || (cat ? getHealthyPercent(cat.name) : undefined);
                      const pctOfIncome = monthlyIncome > 0 && cur === "BRL" ? (b.amount / monthlyIncome) * 100 : null;
                      const healthRatio = idealPct && pctOfIncome ? (pctOfIncome / idealPct) * 100 : null;

                      return (
                        <Card key={b.id} className="group">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                {cat?.icon ? <span className="text-lg">{cat.icon}</span> : <Wallet className="h-5 w-5 text-muted-foreground" />}
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{b.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {cat?.name || "Global"} · {b.period_month || "Mensal"}
                                    {b.is_recurring && " · 🔄 Recorrente"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDuplicateToNextMonth(b)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors" title="Duplicar para próximo mês">
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => openEdit(b)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => handleDelete(b.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all duration-500", healthRatio !== null ? getHealthColor(healthRatio) : isOver ? "bg-[hsl(var(--expense))]" : "bg-primary")} style={{ width: `${clampedPct}%` }} />
                              </div>
                              <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                                {inlineEditId === b.id ? (
                                  <div className="flex items-center gap-1">
                                    <Input type="number" className="w-24 h-7 text-xs" value={inlineEditValue} onChange={e => setInlineEditValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleInlineSave(b.id)} autoFocus />
                                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => handleInlineSave(b.id)}>OK</Button>
                                  </div>
                                ) : (
                                  <span className={cn("font-semibold tabular-nums cursor-pointer hover:underline", healthRatio !== null ? getHealthTextColor(healthRatio) : isOver ? "text-destructive" : "text-foreground")}
                                    onClick={() => { setInlineEditId(b.id); setInlineEditValue(String(b.amount)); }}>
                                    {formatCurrency(spent, cur)} gastos de {formatCurrency(b.amount, cur)}
                                    {pctOfIncome !== null && <span className="text-muted-foreground font-normal ml-1">({Math.round(pctOfIncome)}% da renda)</span>}
                                  </span>
                                )}
                              </div>
                              {idealPct ? (() => {
                                const tooltipText = cat ? getBenchmarkTooltip(cat.name) : null;
                                const badge = (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 border border-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary cursor-help">
                                    🎯 Ideal: até {idealPct}% da renda
                                  </span>
                                );
                                return (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    {tooltipText ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>{badge}</TooltipTrigger>
                                        <TooltipContent className="max-w-xs text-xs">{tooltipText}</TooltipContent>
                                      </Tooltip>
                                    ) : badge}
                                    {healthRatio !== null && healthRatio > 100 && <span className="text-[10px] text-amber-600 font-medium">↑ {Math.round(healthRatio - 100)}% acima</span>}
                                  </div>
                                );
                              })() : monthlyIncome <= 0 && cur === "BRL" ? (
                                <p className="text-[10px] text-muted-foreground mt-1">Configure sua renda para ver o % saudável</p>
                              ) : null}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ════════════ TAB 2 — PLANILHA ════════════ */}
        <TabsContent value="spreadsheet">
          <BudgetSpreadsheet
            budgets={budgets}
            categories={categories}
            transactions={transactions}
            selectedMonth={selectedMonth}
            onRefresh={fetchAll}
          />
        </TabsContent>

        {/* ════════════ TAB 2 — REALIZADO ════════════ */}
        <TabsContent value="realized">
          {/* Month selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => <SelectItem key={m} value={m} className="capitalize">{getMonthLabel(m)}</SelectItem>)}
              </SelectContent>
            </Select>

            {realizedData.totalBudgeted > 0 && (
              <span className={cn(
                "text-xs font-semibold px-3 py-1 rounded-full",
                overallPct <= 100 ? "bg-income/10 text-income" : "bg-destructive/10 text-destructive"
              )}>
                {overallPct <= 100 ? "✅ Dentro do orçamento" : `⚠️ ${Math.round(overallPct - 100)}% acima do orçado`}
              </span>
            )}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Orçado</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(realizedData.totalBudgeted, "BRL")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Realizado</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(realizedData.totalSpent, "BRL")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Diferença</p>
                <p className={cn("text-lg font-bold tabular-nums", totalDiff >= 0 ? "text-income" : "text-destructive")}>
                  {totalDiff >= 0 ? "+" : ""}{formatCurrency(totalDiff, "BRL")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budgeted categories table */}
          {realizedData.budgeted.length > 0 ? (
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="p-3 text-xs font-medium text-muted-foreground">Categoria</th>
                        <th className="p-3 text-xs font-medium text-muted-foreground text-right">Orçado</th>
                        <th className="p-3 text-xs font-medium text-muted-foreground text-right">Realizado</th>
                        <th className="p-3 text-xs font-medium text-muted-foreground text-right">Diferença</th>
                        <th className="p-3 text-xs font-medium text-muted-foreground w-32">% usado</th>
                        <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realizedData.budgeted.map(row => (
                        <tr key={row.budgetId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{row.cat?.icon || "📁"}</span>
                              <span className="font-medium text-foreground">{row.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-right tabular-nums text-foreground">{formatCurrency(row.budgeted, row.currency as Currency)}</td>
                          <td className="p-3 text-right tabular-nums text-foreground">{formatCurrency(row.spent, row.currency as Currency)}</td>
                          <td className={cn("p-3 text-right tabular-nums font-medium", row.diff >= 0 ? "text-income" : "text-destructive")}>
                            {row.diff >= 0 ? "+" : ""}{formatCurrency(row.diff, row.currency as Currency)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all", getUsageColor(row.pct))} style={{ width: `${Math.min(row.pct, 100)}%` }} />
                              </div>
                              <span className="text-[11px] tabular-nums text-muted-foreground w-10 text-right">{Math.round(row.pct)}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", row.status.cls)}>
                              {row.status.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <Target className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum orçamento definido para {getMonthLabel(selectedMonth)}</p>
              </CardContent>
            </Card>
          )}

          {/* Unbudgeted spending */}
          {realizedData.unbudgeted.length > 0 && (
            <Card className="mb-6 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-semibold text-foreground">Gastos sem orçamento definido</p>
                </div>
                <div className="space-y-2">
                  {realizedData.unbudgeted.map((u, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{u.cat.icon}</span>
                        <span className="text-foreground">{u.cat.name}</span>
                      </span>
                      <span className="tabular-nums text-destructive font-medium">
                        {formatCurrency(u.spent, u.currency as Currency)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-3">Crie orçamentos para essas categorias na aba "Orçamentos"</p>
              </CardContent>
            </Card>
          )}

          {/* Duplicate to next month */}
          <Button variant="outline" className="w-full gap-2 mb-6" onClick={handleDuplicateToNextFromRealized}>
            <Copy className="h-4 w-4" /> Usar este mês como base para o próximo
          </Button>

          {/* History last 3 months */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {historyMonths.filter(h => h.hasBudgets).map(h => (
              <button
                key={h.month}
                onClick={() => setSelectedMonth(h.month)}
                className="rounded-lg border p-3 text-left hover:border-primary/40 transition-colors"
              >
                <p className="text-xs font-medium text-foreground capitalize">{h.label}</p>
                <p className={cn("text-sm font-bold mt-1", h.adherence >= 90 ? "text-income" : h.adherence >= 70 ? "text-amber-600" : "text-destructive")}>
                  {h.adherence}% dentro do orçado
                  {h.adherence >= 90 ? " 🟢" : h.adherence >= 70 ? " 🟡" : " 🔴"}
                </p>
              </button>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nome</Label>
              <Input placeholder="Ex: Gastos mensais" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Moeda</Label>
                <Select value={currency} onValueChange={v => setCurrency(v as Currency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">🌐 Global (todas)</SelectItem>
                    {hierarchicalExpenseCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.isChild ? `    └ ${c.icon} ${c.name}` : `${c.icon} ${c.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoryId !== "global" && parentCategoriesWithChildren.has(categoryId) && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    💡 Dica: considere selecionar uma subcategoria para controle mais preciso
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Limite</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} min={0} step={0.01} />
              </div>
              <div>
                <Label>% saudável da renda</Label>
                <Input type="number" placeholder="Ex: 30" value={healthyPct} onChange={e => setHealthyPct(e.target.value)} min={0} max={100} />
                {healthyPct && <p className="text-[10px] text-muted-foreground mt-1">🎯 Ideal: até {healthyPct}% da renda</p>}
              </div>
            </div>
            {!editingBudget && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox id="recurring" checked={isRecurring} onCheckedChange={v => setIsRecurring(!!v)} />
                  <Label htmlFor="recurring" className="text-sm cursor-pointer">Criar para múltiplos meses (recorrente)</Label>
                </div>
                {isRecurring && (
                  <div>
                    <Label>Quantos meses (a partir de {getMonthLabel(selectedMonth)})</Label>
                    <Input type="number" value={recurMonths} onChange={e => setRecurMonths(e.target.value)} min={1} max={12} />
                  </div>
                )}
              </>
            )}
            <Button onClick={handleSave} className="w-full">
              {editingBudget ? "Salvar Alterações" : "Criar Orçamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
