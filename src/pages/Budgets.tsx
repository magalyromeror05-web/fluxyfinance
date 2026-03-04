import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { mockCategories, mockTransactions, formatCurrency, type Currency } from "@/data/mockData";
import { Plus, Pencil, Trash2, Target, Wallet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Budget {
  id: string;
  user_id: string;
  currency: string;
  category_id: string | null;
  name: string;
  amount: number;
  period: string;
  period_start_day: number;
  created_at: string;
  updated_at: string;
}

const currencies: Currency[] = ["BRL", "USD", "PYG"];
const periods = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
];

const expenseCategories = mockCategories.filter(c => c.type === "expense" && !c.parentId);

function getSpentForBudget(budget: Budget): number {
  const categoryIds = budget.category_id
    ? [budget.category_id, ...mockCategories.filter(c => c.parentId === budget.category_id).map(c => c.id)]
    : mockCategories.filter(c => c.type === "expense").map(c => c.id);

  return mockTransactions
    .filter(t => t.currency === budget.currency && categoryIds.includes(t.categoryId) && t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [filterCurrency, setFilterCurrency] = useState<Currency | "ALL">("ALL");

  // Form state
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [categoryId, setCategoryId] = useState<string>("global");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [periodStartDay, setPeriodStartDay] = useState("1");

  const fetchBudgets = async () => {
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar orçamentos");
      console.error(error);
    } else {
      setBudgets((data as Budget[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const resetForm = () => {
    setName("");
    setCurrency("BRL");
    setCategoryId("global");
    setAmount("");
    setPeriod("monthly");
    setPeriodStartDay("1");
    setEditingBudget(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditingBudget(b);
    setName(b.name);
    setCurrency(b.currency as Currency);
    setCategoryId(b.category_id || "global");
    setAmount(String(b.amount));
    setPeriod(b.period);
    setPeriodStartDay(String(b.period_start_day));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !amount || Number(amount) <= 0) {
      toast.error("Preencha nome e valor");
      return;
    }

    const payload = {
      user_id: user!.id,
      name: name.trim(),
      currency,
      category_id: categoryId === "global" ? null : categoryId,
      amount: Number(amount),
      period,
      period_start_day: Number(periodStartDay),
      updated_at: new Date().toISOString(),
    };

    if (editingBudget) {
      const { error } = await supabase
        .from("budgets")
        .update(payload)
        .eq("id", editingBudget.id);
      if (error) {
        toast.error("Erro ao atualizar");
        return;
      }
      toast.success("Orçamento atualizado");
    } else {
      const { error } = await supabase.from("budgets").insert(payload);
      if (error) {
        toast.error("Erro ao criar orçamento");
        return;
      }
      toast.success("Orçamento criado");
    }

    setDialogOpen(false);
    resetForm();
    fetchBudgets();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Orçamento excluído");
    fetchBudgets();
  };

  const filtered = filterCurrency === "ALL"
    ? budgets
    : budgets.filter(b => b.currency === filterCurrency);

  const groupedByCurrency = currencies
    .filter(c => filterCurrency === "ALL" || c === filterCurrency)
    .map(cur => ({
      currency: cur,
      items: filtered.filter(b => b.currency === cur),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Controle de gastos por moeda e categoria.
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Currency filter */}
      <div className="flex gap-2 mb-6">
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

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Target className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-medium text-foreground">Nenhum orçamento criado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Crie seu primeiro orçamento para começar a controlar seus gastos.
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
                  const catName = b.category_id
                    ? mockCategories.find(c => c.id === b.category_id)?.name
                    : null;
                  const catIcon = b.category_id
                    ? mockCategories.find(c => c.id === b.category_id)?.icon
                    : null;

                  return (
                    <Card key={b.id} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {catIcon ? (
                              <span className="text-lg">{catIcon}</span>
                            ) : (
                              <Wallet className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{b.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {catName || "Global"} · {periods.find(p => p.value === b.period)?.label}
                                {b.period === "monthly" && b.period_start_day !== 1
                                  ? ` (dia ${b.period_start_day})`
                                  : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <Input
                placeholder="Ex: Gastos mensais"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Moeda</Label>
                <Select value={currency} onValueChange={v => setCurrency(v as Currency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min={0}
                step={0.01}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Período</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Dia início</Label>
                <Input
                  type="number"
                  value={periodStartDay}
                  onChange={e => setPeriodStartDay(e.target.value)}
                  min={1}
                  max={period === "weekly" ? 7 : 31}
                />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              {editingBudget ? "Salvar Alterações" : "Criar Orçamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
