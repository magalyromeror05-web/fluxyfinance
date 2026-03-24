import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Plus, Target, MoreHorizontal, Pencil, Link2, Archive, TrendingUp, Wallet, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";

const GOAL_TYPES = [
  { value: "emergency_fund", label: "Fundo de Emergência", icon: "🛡️" },
  { value: "travel", label: "Viagem", icon: "✈️" },
  { value: "vehicle", label: "Veículo", icon: "🚗" },
  { value: "property", label: "Imóvel", icon: "🏡" },
  { value: "education", label: "Educação", icon: "🎓" },
  { value: "retirement", label: "Aposentadoria", icon: "🏖️" },
  { value: "other", label: "Outro", icon: "🎯" },
];

const COLORS = [
  { value: "purple", bg: "bg-purple-500/15", text: "text-purple-600", bar: "bg-purple-500" },
  { value: "blue", bg: "bg-blue-500/15", text: "text-blue-600", bar: "bg-blue-500" },
  { value: "green", bg: "bg-emerald-500/15", text: "text-emerald-600", bar: "bg-emerald-500" },
  { value: "amber", bg: "bg-amber-500/15", text: "text-amber-600", bar: "bg-amber-500" },
  { value: "coral", bg: "bg-rose-500/15", text: "text-rose-600", bar: "bg-rose-500" },
  { value: "cyan", bg: "bg-cyan-500/15", text: "text-cyan-600", bar: "bg-cyan-500" },
];

function getColor(color: string) {
  return COLORS.find((c) => c.value === color) || COLORS[0];
}

function monthsRemaining(targetDate: string | null): number | null {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const now = new Date();
  const diff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(0, diff);
}

function getStatusBadge(pct: number, monthsLeft: number | null) {
  if (pct >= 100) return { label: "🏆 Concluída", variant: "default" as const, cls: "bg-emerald-500/15 text-emerald-700 border-emerald-200" };
  if (monthsLeft !== null && monthsLeft > 0) {
    // expected progress by elapsed time
    const now = new Date();
    // we don't know created_at here easily, so just check if behind
    if (pct < 50 && monthsLeft <= 3) return { label: "⚠️ Atenção", variant: "secondary" as const, cls: "bg-amber-500/15 text-amber-700 border-amber-200" };
  }
  return { label: "🟢 No prazo", variant: "secondary" as const, cls: "bg-emerald-500/10 text-emerald-700 border-emerald-200" };
}

export default function Goals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [showContribution, setShowContribution] = useState<any>(null);
  const [contributionAmount, setContributionAmount] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("other");
  const [formIcon, setFormIcon] = useState("🎯");
  const [formColor, setFormColor] = useState("purple");
  const [formTargetAmount, setFormTargetAmount] = useState("");
  const [formCurrentAmount, setFormCurrentAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState("BRL");
  const [formTargetDate, setFormTargetDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLinkedInvestment, setFormLinkedInvestment] = useState("");

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: investments = [] } = useQuery({
    queryKey: ["investments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("investments").select("*");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  // Emergency fund auto card
  const emergencyInvestments = investments.filter((i: any) => i.is_emergency_fund);
  const emergencyTotal = emergencyInvestments.reduce((s: number, i: any) => s + (i.current_value || 0), 0);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("monthly_income_brl").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets-total", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("budgets").select("amount").eq("currency", "BRL");
      return data ?? [];
    },
    enabled: !!user,
  });

  const monthlyExpenses = budgets.reduce((s: number, b: any) => s + (b.amount || 0), 0);
  const emergencyMonths = monthlyExpenses > 0 ? emergencyTotal / monthlyExpenses : ((profile as any)?.monthly_income_brl > 0 ? emergencyTotal / (profile as any).monthly_income_brl : 0);

  const activeGoals = goals.filter((g: any) => g.status === "active");

  const summary = useMemo(() => {
    const total = activeGoals.reduce((s: number, g: any) => s + Number(g.target_amount), 0);
    const saved = activeGoals.reduce((s: number, g: any) => s + Number(g.current_amount), 0);
    const monthlyNeeded = activeGoals.reduce((s: number, g: any) => {
      const months = monthsRemaining(g.target_date);
      if (months && months > 0) {
        const remaining = Number(g.target_amount) - Number(g.current_amount);
        return s + Math.max(0, remaining / months);
      }
      return s;
    }, 0);
    return { total, saved, monthlyNeeded };
  }, [activeGoals]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingGoal) {
        const { error } = await supabase.from("goals").update(data).eq("id", editingGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert({ ...data, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success(editingGoal ? "Meta atualizada!" : "Meta criada!");
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar meta"),
  });

  const contributionMutation = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      const goal = goals.find((g: any) => g.id === goalId);
      if (!goal) throw new Error("Meta não encontrada");
      const newAmount = Number(goal.current_amount) + amount;
      const updates: any = { current_amount: newAmount };
      if (newAmount >= Number(goal.target_amount)) updates.status = "completed";
      const { error } = await supabase.from("goals").update(updates).eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Aporte registrado!");
      setShowContribution(null);
      setContributionAmount("");
    },
    onError: () => toast.error("Erro ao registrar aporte"),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta arquivada");
    },
  });

  function resetForm() {
    setShowForm(false);
    setEditingGoal(null);
    setFormTitle("");
    setFormType("other");
    setFormIcon("🎯");
    setFormColor("purple");
    setFormTargetAmount("");
    setFormCurrentAmount("");
    setFormCurrency("BRL");
    setFormTargetDate("");
    setFormDescription("");
    setFormLinkedInvestment("");
  }

  function openEdit(goal: any) {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormType(goal.type);
    setFormIcon(goal.icon || "🎯");
    setFormColor(goal.color || "purple");
    setFormTargetAmount(String(goal.target_amount));
    setFormCurrentAmount(String(goal.current_amount));
    setFormCurrency(goal.currency);
    setFormTargetDate(goal.target_date || "");
    setFormDescription(goal.description || "");
    setFormLinkedInvestment(goal.linked_investment_id || "");
    setShowForm(true);
  }

  function handleSave() {
    if (!formTitle.trim() || !formTargetAmount) return;
    const target = Number(formTargetAmount);
    const current = Number(formCurrentAmount) || 0;
    const months = formTargetDate ? monthsRemaining(formTargetDate) : null;
    const monthlyContribution = months && months > 0 ? Math.max(0, (target - current) / months) : null;

    saveMutation.mutate({
      title: formTitle.trim(),
      type: formType,
      icon: formIcon,
      color: formColor,
      target_amount: target,
      current_amount: current,
      currency: formCurrency,
      target_date: formTargetDate || null,
      description: formDescription.trim() || null,
      monthly_contribution: monthlyContribution,
      linked_investment_id: formLinkedInvestment || null,
    });
  }

  const calculatedMonthly = useMemo(() => {
    const target = Number(formTargetAmount) || 0;
    const current = Number(formCurrentAmount) || 0;
    const months = formTargetDate ? monthsRemaining(formTargetDate) : null;
    if (months && months > 0 && target > current) return (target - current) / months;
    return null;
  }, [formTargetAmount, formCurrentAmount, formTargetDate]);

  // Form component
  const formContent = (
    <div className="space-y-4 p-1">
      <div className="flex gap-3">
        <div>
          <Label className="text-xs mb-1 block">Ícone</Label>
          <EmojiPicker value={formIcon} onChange={setFormIcon} />
        </div>
        <div className="flex-1">
          <Label className="text-xs mb-1 block">Título</Label>
          <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ex: Viagem para Europa" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Tipo</Label>
          <Select value={formType} onValueChange={setFormType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {GOAL_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Cor</Label>
          <div className="flex gap-1.5 pt-1">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setFormColor(c.value)}
                className={cn(
                  "w-7 h-7 rounded-full transition-all",
                  c.bar,
                  formColor === c.value ? "ring-2 ring-offset-2 ring-primary" : "opacity-60 hover:opacity-100"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Valor alvo</Label>
          <Input type="number" value={formTargetAmount} onChange={(e) => setFormTargetAmount(e.target.value)} placeholder="50000" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Moeda</Label>
          <Select value={formCurrency} onValueChange={setFormCurrency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">🇧🇷 BRL</SelectItem>
              <SelectItem value="USD">🇺🇸 USD</SelectItem>
              <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
              <SelectItem value="PYG">🇵🇾 PYG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Já tenho guardado</Label>
          <Input type="number" value={formCurrentAmount} onChange={(e) => setFormCurrentAmount(e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Prazo (mês/ano)</Label>
          <Input type="month" value={formTargetDate} onChange={(e) => setFormTargetDate(e.target.value)} />
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1 block">Vincular a investimento (opcional)</Label>
        <Select value={formLinkedInvestment} onValueChange={setFormLinkedInvestment}>
          <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {investments.map((inv: any) => (
              <SelectItem key={inv.id} value={inv.id}>{inv.name} — {formatCurrency(inv.current_value, inv.currency)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs mb-1 block">Descrição (opcional)</Label>
        <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} rows={2} placeholder="Detalhes da meta..." />
      </div>

      {calculatedMonthly !== null && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
          <p className="text-xs text-muted-foreground">Para atingir essa meta, você precisará poupar</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(calculatedMonthly, formCurrency)}/mês</p>
        </div>
      )}

      <Button className="w-full" onClick={handleSave} disabled={!formTitle.trim() || !formTargetAmount || saveMutation.isPending}>
        {saveMutation.isPending ? "Salvando..." : editingGoal ? "Atualizar meta" : "Criar meta"}
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6" /> Metas Financeiras
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Transforme sonhos em planos concretos</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Nova meta
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total em metas</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(summary.total, "BRL")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <PiggyBank className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Já guardado</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(summary.saved, "BRL")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contribuição mensal</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(summary.monthlyNeeded, "BRL")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Fund Auto Card */}
      {emergencyInvestments.length > 0 && (
        <Card className="mb-6 border-emerald-200/50">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🛡️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Fundo de Emergência</p>
                <p className="text-xs text-muted-foreground">Calculado automaticamente dos seus investimentos</p>
              </div>
              <Badge className={cn("text-xs", emergencyMonths >= 6 ? "bg-emerald-500/15 text-emerald-700" : emergencyMonths >= 3 ? "bg-amber-500/15 text-amber-700" : "bg-rose-500/15 text-rose-700")}>
                {emergencyMonths >= 6 ? "🟢 Saudável" : emergencyMonths >= 3 ? "🟡 Atenção" : "🔴 Insuficiente"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">{emergencyMonths.toFixed(1)} meses cobertos de 6 ideais</span>
              <span className="font-semibold">{formatCurrency(emergencyTotal, "BRL")}</span>
            </div>
            <Progress value={Math.min((emergencyMonths / 6) * 100, 100)} className="h-2.5" />
          </CardContent>
        </Card>
      )}

      {/* Goals Grid */}
      {activeGoals.length === 0 && !emergencyInvestments.length ? (
        <Card className="p-10 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Crie sua primeira meta</h2>
          <p className="text-sm text-muted-foreground mb-4">Defina objetivos financeiros e acompanhe seu progresso.</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nova meta
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal: any) => {
            const pct = Number(goal.target_amount) > 0 ? (Number(goal.current_amount) / Number(goal.target_amount)) * 100 : 0;
            const months = monthsRemaining(goal.target_date);
            const colorDef = getColor(goal.color);
            const neededMonthly = months && months > 0 ? Math.max(0, (Number(goal.target_amount) - Number(goal.current_amount)) / months) : null;
            const status = getStatusBadge(pct, months);

            return (
              <Card key={goal.id} className={cn("overflow-hidden transition-all hover:shadow-md", goal.status === "cancelled" && "opacity-50")}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center text-xl", colorDef.bg)}>
                        {goal.icon || "🎯"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                        <p className="text-xs text-muted-foreground">{GOAL_TYPES.find((t) => t.value === goal.type)?.label ?? goal.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px] border", status.cls)}>{status.label}</Badge>
                      {goal.status === "active" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(goal)}><Pencil className="h-3.5 w-3.5 mr-2" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(goal)}><Link2 className="h-3.5 w-3.5 mr-2" /> Vincular investimento</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => archiveMutation.mutate(goal.id)} className="text-destructive"><Archive className="h-3.5 w-3.5 mr-2" /> Arquivar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">
                        {formatCurrency(Number(goal.current_amount), goal.currency)} de {formatCurrency(Number(goal.target_amount), goal.currency)}
                      </span>
                      <span className="font-semibold">{Math.min(pct, 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", colorDef.bar)} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                    {goal.target_date && (
                      <span>📅 Meta: {new Date(goal.target_date + "T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                        {months !== null && ` · ${months} meses restantes`}
                      </span>
                    )}
                    {neededMonthly !== null && neededMonthly > 0 && (
                      <span>💰 {formatCurrency(neededMonthly, goal.currency)}/mês necessário</span>
                    )}
                  </div>

                  {goal.status === "active" && pct < 100 && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setShowContribution(goal)}>
                      <TrendingUp className="h-3.5 w-3.5 mr-1" /> Adicionar aporte
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New/Edit Goal Sheet */}
      <Sheet open={showForm} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90vh] overflow-y-auto" : "overflow-y-auto sm:max-w-md"}>
          <SheetHeader>
            <SheetTitle>{editingGoal ? "Editar meta" : "Nova meta"}</SheetTitle>
          </SheetHeader>
          {formContent}
        </SheetContent>
      </Sheet>

      {/* Contribution Dialog */}
      <Dialog open={!!showContribution} onOpenChange={(open) => { if (!open) { setShowContribution(null); setContributionAmount(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar aporte</DialogTitle>
          </DialogHeader>
          {showContribution && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Meta: <strong>{showContribution.title}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Atual: {formatCurrency(Number(showContribution.current_amount), showContribution.currency)} de {formatCurrency(Number(showContribution.target_amount), showContribution.currency)}
              </p>
              <div>
                <Label className="text-xs mb-1 block">Valor do aporte</Label>
                <Input
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  placeholder="1000"
                  autoFocus
                />
              </div>
              <Button
                className="w-full"
                disabled={!contributionAmount || Number(contributionAmount) <= 0 || contributionMutation.isPending}
                onClick={() => contributionMutation.mutate({ goalId: showContribution.id, amount: Number(contributionAmount) })}
              >
                {contributionMutation.isPending ? "Salvando..." : "Registrar aporte"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
