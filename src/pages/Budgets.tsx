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
import { Progress } from "@/components/ui/progress";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { formatCurrency, type Currency } from "@/data/mockData";
import { Plus, Pencil, Trash2, Target, Wallet, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths, parse } from "date-fns";
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
  created_at: string;
  updated_at: string;
}

const currencies: Currency[] = ["BRL", "USD", "PYG"];

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

  // Form state
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [categoryId, setCategoryId] = useState<string>("global");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(true);
  const [recurMonths, setRecurMonths] = useState("3");

  const fetchAll = async () => {
    const [budgetsRes, categoriesRes, txRes] = await Promise.all([
      supabase.from("budgets").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("created_at", { ascending: true }),
      supabase.from("transactions").select("*"),
    ]);

    if (budgetsRes.data) setBudgets(budgetsRes.data as Budget[]);
    if (categoriesRes.data) setCategories(categoriesRes.data as DbCategory[]);
    if (txRes.data) setTransactions(txRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const expenseCategories = categories.filter(c => c.type === "expense" && !c.parent_id);

  const getSpentForBudget = (budget: Budget): number => {
    const catIds = budget.category_id
      ? [budget.category_id, ...categories.filter(c => c.parent_id === budget.category_id).map(c => c.id)]
      : categories.filter(c => c.type === "expense").map(c => c.id);

    // Determine date range for the budget's month
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

  const resetForm = () => {
    setName(""); setCurrency("BRL"); setCategoryId("global");
    setAmount(""); setIsRecurring(true); setRecurMonths("3");
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
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !amount || Number(amount) <= 0) {
      toast.error("Preencha nome e valor");
      return;
    }

    if (editingBudget) {
      const payload = {
        name: name.trim(),
        currency,
        category_id: categoryId === "global" ? null : categoryId,
        amount: Number(amount),
        is_recurring: isRecurring,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from("budgets").update(payload).eq("id", editingBudget.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Orçamento atualizado");
    } else {
      // Create for current month + future months if recurring
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

    // Check if already exists
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

        <div className="flex gap-2">
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
                  const pct = Math.min((spent / b.amount) * 100, 100);
                  const isOver = spent > b.amount;
                  const cat = b.category_id ? categories.find(c => c.id === b.category_id) : null;

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

                        <div className="space-y-2">
                          <Progress
                            value={pct}
                            className={cn("h-2", isOver && "[&>div]:bg-destructive")}
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span className={cn("font-semibold tabular-nums", isOver ? "text-destructive" : "text-foreground")}>
                              {formatCurrency(spent, cur)}
                            </span>
                            <span className="text-muted-foreground tabular-nums">
                              de {formatCurrency(b.amount, cur)}
                            </span>
                          </div>
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
                <Select value={categoryId} onValueChange={setCategoryId}>
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

            <div>
              <Label>Limite</Label>
              <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} min={0} step={0.01} />
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
