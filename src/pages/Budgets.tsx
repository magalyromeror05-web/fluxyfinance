import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { formatCurrency, type Currency } from "@/data/mockData";
import { BENCHMARK_GROUPS, getHealthyPercent } from "@/data/healthyBudget";
import { Plus, Pencil, Trash2, Target, Wallet, Copy, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, endOfMonth, addMonths, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DbCategory {
  id: string;
  name: string;
  icon: string;
  type: string;
  parent_id: string | null;
}

interface Budget {
  id: string;
  user_id: string;
  currency: string;
  category_id: string | null;
  name: string;
  amount: number;
  period: string;
  period_start_day: number;
  period_month: string | null;
  is_recurring: boolean;
  healthy_pct: number | null;
  created_at: string;
  updated_at: string;
}

const currencies: Currency[] = ["BRL", "USD", "PYG"];

// ─── Health bar color helper ───
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

  const expenseCategories = categories.filter(c => c.type === "expense" && !c.parent_id);

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
    setEditingBudget(b);
    setName(b.name);
    setCurrency(b.currency as Currency);
    setCategoryId(b.category_id || "global");
    setAmount(String(b.amount));
    setIsRecurring(b.is_recurring);
    setRecurMonths("1");
    setHealthyPct(b.healthy_pct ? String(b.healthy_pct) : "");
    setDialogOpen(true);
  };

  // Auto-suggest healthy % when category changes
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    if (catId !== "global") {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        const pct = getHealthyPercent(cat.name);
        if (pct !== undefined) {
          setHealthyPct(String(pct));
          // Also suggest amount if income is set
          if (monthlyIncome > 0 && !amount) {
            setAmount(String(Math.round(monthlyIncome * pct / 100)));
          }
        }
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !amount || Number(amount) <= 0) {
      toast.error("Preencha nome e valor");
      return;
    }

    const hPct = healthyPct ? Number(healthyPct) : null;

    if (editingBudget) {
      const payload = {
        name: name.trim(),
        currency,
        category_id: categoryId === "global" ? null : categoryId,
        amount: Number(amount),
        is_recurring: isRecurring,
        healthy_pct: hPct,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("budgets").update(payload).eq("id", editingBudget.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Orçamento atualizado");
    } else {
      const monthsToCreate = isRecurring ? Math.max(1, Number(recurMonths) || 1) : 1;
      const baseMonth = parse(selectedMonth + "-01", "yyyy-MM-dd", new Date());
      const rows = [];

      for (let i = 0; i < monthsToCreate; i++) {
        const m = addMonths(baseMonth, i);
        rows.push({
          user_id: user!.id,
          name: name.trim(),
          currency,
          category_id: categoryId === "global" ? null : categoryId,
          amount: Number(amount),
          period: "monthly",
          period_start_day: 1,
          period_month: format(m, "yyyy-MM"),
          is_recurring: isRecurring,
          healthy_pct: hPct,
          updated_at: new Date().toISOString(),
        });
      }

      const { error } = await supabase.from("budgets").insert(rows);
      if (error) { toast.error("Erro ao criar orçamento"); console.error(error); return; }
      toast.success(`${rows.length} orçamento(s) criado(s)`);
    }

    setDialogOpen(false);
    resetForm();
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Orçamento excluído");
    fetchAll();
  };

  const handleDuplicateToNextMonth = async (b: Budget) => {
    if (!b.period_month) return;
    const current = parse(b.period_month + "-01", "yyyy-MM-dd", new Date());
    const next = addMonths(current, 1);
    const nextMonth = format(next, "yyyy-MM");

    const exists = budgets.find(
      x => x.name === b.name && x.period_month === nextMonth && x.currency === b.currency
    );
    if (exists) {
      toast.info("Já existe orçamento para o próximo mês");
      return;
    }

    const { error } = await supabase.from("budgets").insert({
      user_id: user!.id,
      name: b.name,
      currency: b.currency,
      category_id: b.category_id,
      amount: b.amount,
      period: "monthly",
      period_start_day: b.period_start_day,
      period_month: nextMonth,
      is_recurring: b.is_recurring,
      healthy_pct: b.healthy_pct,
      updated_at: new Date().toISOString(),
    });
    if (error) { toast.error("Erro ao duplicar"); return; }
    toast.success(`Orçamento duplicado para ${nextMonth}`);
    fetchAll();
  };

  // Filter budgets by selected month
  const monthBudgets = budgets.filter(b => {
    if (b.period_month && b.period_month !== selectedMonth) return false;
    if (filterCurrency !== "ALL" && b.currency !== filterCurrency) return false;
    return true;
  });

  const groupedByCurrency = currencies
    .filter(c => filterCurrency === "ALL" || c === filterCurrency)
    .map(cur => ({
      currency: cur,
      items: monthBudgets.filter(b => b.currency === cur),
    }))
    .filter(g => g.items.length > 0);

  // Generate month options
  const monthOptions: string[] = [];
  for (let i = -3; i <= 6; i++) {
    monthOptions.push(format(addMonths(new Date(), i), "yyyy-MM"));
  }

  const getMonthLabel = (m: string) => {
    const d = parse(m + "-01", "yyyy-MM-dd", new Date());
    return format(d, "MMMM yyyy", { locale: ptBR });
  };

  // ─── Health summary diagnostics ───
  const brlBudgets = monthBudgets.filter(b => b.currency === "BRL");
  const overBudgetCategories = brlBudgets
    .filter(b => {
      if (!monthlyIncome || !b.healthy_pct) return false;
      const idealAmount = monthlyIncome * b.healthy_pct / 100;
      return b.amount > idealAmount;
    })
    .map(b => b.name);

  // Build distribution data for summary chart
  const distributionData = brlBudgets
    .filter(b => b.category_id)
    .map(b => {
      const cat = categories.find(c => c.id === b.category_id);
      const pctOfIncome = monthlyIncome > 0 ? (b.amount / monthlyIncome) * 100 : 0;
      const idealPct = b.healthy_pct || (cat ? getHealthyPercent(cat.name) : undefined) || 0;
      return {
        name: b.name,
        icon: cat?.icon || "📁",
        pctOfIncome: Math.round(pctOfIncome),
        idealPct,
      };
    });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de gastos mensal por moeda e categoria.
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* ─── Monthly Income Card ─── */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">Qual é sua renda mensal em BRL?</p>
                <p className="text-[11px] text-muted-foreground">
                  Usamos isso para calcular os % saudáveis. Só você vê esse dado.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                className="w-36"
                step={100}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={saveIncome}
                disabled={savingIncome}
              >
                {savingIncome ? "..." : "Salvar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Budget Distribution Summary ─── */}
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
                    {/* Ideal marker */}
                    {d.idealPct > 0 && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-foreground/20 z-10"
                        style={{ left: `${Math.min(d.idealPct, 100)}%` }}
                      />
                    )}
                    {/* Actual bar */}
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        d.idealPct > 0
                          ? getHealthColor((d.pctOfIncome / d.idealPct) * 100)
                          : "bg-primary"
                      )}
                      style={{ width: `${Math.min(d.pctOfIncome, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Diagnostic */}
            <div className="mt-4 text-xs">
              {overBudgetCategories.length === 0 ? (
                <p className="text-income font-medium">✅ Sua distribuição está equilibrada</p>
              ) : (
                <p className="text-amber-600 font-medium">
                  ⚠️ {overBudgetCategories.join(", ")} {overBudgetCategories.length === 1 ? "está" : "estão"} acima do recomendado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month selector + Currency filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => (
              <SelectItem key={m} value={m} className="capitalize">{getMonthLabel(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2 flex-wrap">
          {(["ALL", "BRL", "USD", "PYG"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterCurrency(f)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border",
                filterCurrency === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {f === "ALL" ? "Todas" : f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : monthBudgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Target className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-medium text-foreground">Nenhum orçamento para {getMonthLabel(selectedMonth)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie um orçamento para controlar seus gastos neste mês.
              </p>
            </div>
            <Button onClick={openCreate} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Orçamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedByCurrency.map(({ currency: cur, items }) => (
            <div key={cur}>
              <div className="flex items-center gap-2 mb-3">
                <CurrencyBadge currency={cur} />
                <span className="text-sm text-muted-foreground">
                  {items.length} orçamento{items.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid gap-3">
                {items.map(b => {
                  const spent = getSpentForBudget(b);
                  const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
                  const clampedPct = Math.min(pct, 100);
                  const isOver = spent > b.amount;
                  const cat = b.category_id ? categories.find(c => c.id === b.category_id) : null;

                  // Health calculations
                  const idealPct = b.healthy_pct || (cat ? getHealthyPercent(cat.name) : undefined);
                  const pctOfIncome = monthlyIncome > 0 && cur === "BRL"
                    ? (b.amount / monthlyIncome) * 100
                    : null;
                  const healthRatio = idealPct && pctOfIncome
                    ? (pctOfIncome / idealPct) * 100
                    : null;

                  return (
                    <Card key={b.id} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {cat?.icon ? (
                              <span className="text-lg">{cat.icon}</span>
                            ) : (
                              <Wallet className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{b.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {cat?.name || "Global"} · {b.period_month || "Mensal"}
                                {b.is_recurring && " · 🔄 Recorrente"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleDuplicateToNextMonth(b)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                              title="Duplicar para próximo mês"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => openEdit(b)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Health-colored progress bar */}
                        <div className="space-y-2">
                          <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                healthRatio !== null
                                  ? getHealthColor(healthRatio)
                                  : isOver
                                  ? "bg-[hsl(var(--expense))]"
                                  : "bg-primary"
                              )}
                              style={{ width: `${clampedPct}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                            <span className={cn(
                              "font-semibold tabular-nums",
                              healthRatio !== null
                                ? getHealthTextColor(healthRatio)
                                : isOver ? "text-destructive" : "text-foreground"
                            )}>
                              {formatCurrency(spent, cur)} gastos de {formatCurrency(b.amount, cur)}
                              {pctOfIncome !== null && (
                                <span className="text-muted-foreground font-normal ml-1">
                                  ({Math.round(pctOfIncome)}% da renda)
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Healthy % badge */}
                          {idealPct ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 border border-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                🎯 Ideal: até {idealPct}% da renda
                              </span>
                              {healthRatio !== null && healthRatio > 100 && (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  ↑ {Math.round(healthRatio - 100)}% acima
                                </span>
                              )}
                            </div>
                          ) : monthlyIncome <= 0 && cur === "BRL" ? (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Configure sua renda para ver o % saudável
                            </p>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
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
                  <SelectContent>
                    {currencies.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={categoryId} onValueChange={handleCategoryChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">🌐 Global (todas)</SelectItem>
                    {expenseCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Limite</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} min={0} step={0.01} />
              </div>
              <div>
                <Label>% saudável da renda</Label>
                <Input
                  type="number"
                  placeholder="Ex: 30"
                  value={healthyPct}
                  onChange={e => setHealthyPct(e.target.value)}
                  min={0}
                  max={100}
                />
                {healthyPct && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    🎯 Ideal: até {healthyPct}% da renda
                  </p>
                )}
              </div>
            </div>

            {!editingBudget && (
              <>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="recurring"
                    checked={isRecurring}
                    onCheckedChange={(v) => setIsRecurring(!!v)}
                  />
                  <Label htmlFor="recurring" className="text-sm cursor-pointer">
                    Criar para múltiplos meses (recorrente)
                  </Label>
                </div>

                {isRecurring && (
                  <div>
                    <Label>Quantos meses (a partir de {getMonthLabel(selectedMonth)})</Label>
                    <Input
                      type="number"
                      value={recurMonths}
                      onChange={e => setRecurMonths(e.target.value)}
                      min={1}
                      max={12}
                    />
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
