import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { formatCurrency as baseFormatCurrency, type Currency } from "@/data/mockData";
import { getHealthyPercent } from "@/data/healthyBudget";

// Extended formatter that handles EUR
function formatCurrency(amount: number, currency: string): string {
  if (currency === "EUR") {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "EUR" }).format(amount);
  }
  return baseFormatCurrency(amount, currency as Currency);
}
import { getHealthyPercent } from "@/data/healthyBudget";
import {
  Calculator, Plus, Trash2, Archive, Home, CreditCard, Car,
  Tv, HeartPulse, Pencil, AlertTriangle, TrendingDown, TrendingUp,
  PiggyBank, BarChart3, CalendarDays, Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DbCategory {
  id: string; name: string; icon: string; type: string; parent_id: string | null;
}

interface Simulation {
  id: string; user_id: string; name: string; type: string; currency: string;
  monthly_amount: number; duration_type: string; duration_value: number | null;
  category_id: string | null; metadata: any; status: string; created_at: string;
}

const SIM_TYPES = [
  { value: "housing", label: "🏠 Moradia (aluguel + pacote)", icon: Home },
  { value: "credit_card", label: "💳 Cartão de crédito", icon: CreditCard },
  { value: "financing", label: "🚗 Financiamento/parcela", icon: Car },
  { value: "subscription", label: "📺 Assinatura recorrente", icon: Tv },
  { value: "health", label: "🏥 Saúde/plano", icon: HeartPulse },
  { value: "custom", label: "✏️ Personalizado", icon: Pencil },
];

const currencies = ["BRL", "USD", "EUR", "PYG"] as const;
type SimCurrency = (typeof currencies)[number];

export default function Simulator() {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Income & current expenses
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [currentExpenses, setCurrentExpenses] = useState(0);

  // Form
  const [simName, setSimName] = useState("");
  const [simType, setSimType] = useState("custom");
  const [simCurrency, setSimCurrency] = useState<SimCurrency>("BRL");
  const [simCategoryId, setSimCategoryId] = useState<string>("");
  const [simDurationType, setSimDurationType] = useState("indefinite");
  const [simDurationValue, setSimDurationValue] = useState("");
  const [simDurationUnit, setSimDurationUnit] = useState("months");
  const [simDescription, setSimDescription] = useState("");

  // Housing fields
  const [rent, setRent] = useState("");
  const [condo, setCondo] = useState("");
  const [iptu, setIptu] = useState("");
  const [insurance, setInsurance] = useState("");

  // Credit card fields
  const [ccCurrent, setCcCurrent] = useState("");
  const [ccNew, setCcNew] = useState("");

  // Generic amount
  const [simAmount, setSimAmount] = useState("");

  const fetchAll = async () => {
    const [simRes, catRes, profileRes, txRes] = await Promise.all([
      supabase.from("simulations").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("profiles").select("monthly_income_brl").eq("id", user!.id).single(),
      supabase.from("transactions").select("amount, currency, posted_at")
        .lt("amount", 0)
        .gte("posted_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .lte("posted_at", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59).toISOString()),
    ]);
    if (simRes.data) setSimulations(simRes.data as any[]);
    if (catRes.data) setCategories(catRes.data as DbCategory[]);
    if (profileRes.data) setMonthlyIncome((profileRes.data as any).monthly_income_brl || 0);
    if (txRes.data) {
      const total = (txRes.data as any[])
        .filter((t: any) => t.currency === "BRL")
        .reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
      setCurrentExpenses(total);
    }
    setLoading(false);
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  const expenseCategories = categories.filter(c => c.type === "expense" && !c.parent_id);

  const computedAmount = useMemo(() => {
    if (simType === "housing") {
      return (parseFloat(rent) || 0) + (parseFloat(condo) || 0) + (parseFloat(iptu) || 0) + (parseFloat(insurance) || 0);
    }
    if (simType === "credit_card") {
      return Math.max(0, (parseFloat(ccNew) || 0) - (parseFloat(ccCurrent) || 0));
    }
    return parseFloat(simAmount) || 0;
  }, [simType, rent, condo, iptu, insurance, ccCurrent, ccNew, simAmount]);

  const durationMonths = useMemo(() => {
    if (simDurationType === "indefinite") return null;
    if (simDurationType === "6months") return 6;
    if (simDurationType === "1year") return 12;
    const val = parseInt(simDurationValue) || 1;
    return simDurationUnit === "years" ? val * 12 : val;
  }, [simDurationType, simDurationValue, simDurationUnit]);

  // Impact calculations
  const newBalance = monthlyIncome - currentExpenses - computedAmount;
  const currentBalance = monthlyIncome - currentExpenses;
  const balanceChange = currentBalance > 0 ? ((computedAmount / currentBalance) * 100) : 0;

  const currentSavingsRate = monthlyIncome > 0 ? (currentBalance / monthlyIncome) * 100 : 0;
  const newSavingsRate = monthlyIncome > 0 ? (newBalance / monthlyIncome) * 100 : 0;

  const selectedCategory = categories.find(c => c.id === simCategoryId);
  const benchmarkPct = selectedCategory ? getHealthyPercent(selectedCategory.name) : undefined;
  const currentCategoryPct = monthlyIncome > 0 && benchmarkPct !== undefined
    ? (currentExpenses * 0.3 / monthlyIncome) * 100 // approximate
    : null;
  const newCategoryPct = monthlyIncome > 0 && benchmarkPct !== undefined
    ? ((currentExpenses * 0.3 + computedAmount) / monthlyIncome) * 100
    : null;

  const totalCost = durationMonths ? computedAmount * durationMonths : null;

  const getSavingsLabel = (rate: number) => {
    if (rate >= 20) return { label: "🟢 Saudável", color: "text-income" };
    if (rate >= 10) return { label: "🟡 Atenção", color: "text-amber-600" };
    return { label: "🔴 Risco", color: "text-destructive" };
  };

  const getDiagnosis = () => {
    if (newBalance >= 0 && newSavingsRate >= 10) return { icon: "✅", text: "Esse gasto cabe no seu orçamento atual", color: "text-income" };
    if (newSavingsRate < 10 && newBalance >= 0) return { icon: "⚠️", text: "Esse gasto compromete sua reserva de emergência", color: "text-amber-600" };
    return { icon: "🔴", text: "Atenção: esse gasto deixa seu orçamento no negativo", color: "text-destructive" };
  };

  const resetForm = () => {
    setSimName(""); setSimType("custom"); setSimCurrency("BRL");
    setSimCategoryId(""); setSimDurationType("indefinite");
    setSimDurationValue(""); setSimDurationUnit("months"); setSimDescription("");
    setRent(""); setCondo(""); setIptu(""); setInsurance("");
    setCcCurrent(""); setCcNew(""); setSimAmount("");
    setShowResult(false);
  };

  const handleSave = async () => {
    if (!simName.trim() || computedAmount <= 0) {
      toast.error("Preencha o nome e valor da simulação");
      return;
    }
    const metadata: any = {};
    if (simType === "housing") Object.assign(metadata, { rent: parseFloat(rent) || 0, condo: parseFloat(condo) || 0, iptu: parseFloat(iptu) || 0, insurance: parseFloat(insurance) || 0 });
    if (simType === "credit_card") Object.assign(metadata, { current: parseFloat(ccCurrent) || 0, new_value: parseFloat(ccNew) || 0 });
    if (simDescription) metadata.description = simDescription;

    const durVal = durationMonths;

    const { error } = await supabase.from("simulations").insert({
      user_id: user!.id,
      name: simName.trim(),
      type: simType,
      currency: simCurrency,
      monthly_amount: computedAmount,
      duration_type: simDurationType === "6months" || simDurationType === "1year" ? "months" : simDurationType === "specific" ? (simDurationUnit === "years" ? "years" : "months") : "indefinite",
      duration_value: durVal,
      category_id: simCategoryId || null,
      metadata,
      status: "active",
    } as any);

    if (error) { toast.error("Erro ao salvar simulação"); console.error(error); return; }
    toast.success("Simulação salva!");
    setSheetOpen(false);
    resetForm();
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("simulations").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Simulação excluída");
    fetchAll();
  };

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from("simulations").update({ status: "archived" } as any).eq("id", id);
    if (error) { toast.error("Erro ao arquivar"); return; }
    toast.success("Simulação arquivada");
    fetchAll();
  };

  const diagnosis = getDiagnosis();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Simulador de Cenários</h1>
          <p className="text-sm text-muted-foreground mt-1">Teste decisões financeiras antes de tomá-las</p>
        </div>
        <Button onClick={() => { resetForm(); setSheetOpen(true); }} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova simulação
        </Button>
      </div>

      {/* Income warning */}
      {monthlyIncome <= 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Configure sua renda para cálculos precisos</p>
              <a href="/orcamentos" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                <LinkIcon className="h-3 w-3" /> Ir para Orçamentos
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved simulations */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : simulations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Calculator className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-medium text-foreground">Nenhuma simulação criada</p>
              <p className="text-sm text-muted-foreground mt-1">Crie uma simulação para testar decisões financeiras.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {simulations.map(sim => {
            const typeInfo = SIM_TYPES.find(t => t.value === sim.type);
            return (
              <Card key={sim.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{sim.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {typeInfo?.label.split(" ").slice(1).join(" ") || sim.type} · {sim.currency}
                      </p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                      sim.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {sim.status === "active" ? "Ativa" : "Arquivada"}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {formatCurrency(sim.monthly_amount, sim.currency as Currency)}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {sim.duration_type === "indefinite" ? "Indefinido" : `${sim.duration_value} meses`}
                    {" · "}Criado em {format(new Date(sim.created_at), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {sim.status === "active" && (
                      <button onClick={() => handleArchive(sim.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors" title="Arquivar">
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(sim.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors" title="Excluir">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sheet Form */}
      <Sheet open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) resetForm(); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nova Simulação</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 pt-4">
            <div>
              <Label>Nome da simulação</Label>
              <Input placeholder='Ex: "Novo apartamento"' value={simName} onChange={e => setSimName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={simType} onValueChange={setSimType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Moeda</Label>
                <Select value={simCurrency} onValueChange={v => setSimCurrency(v as SimCurrency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type-specific fields */}
            {simType === "housing" && (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-xs font-semibold text-muted-foreground">Detalhes da moradia</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Aluguel</Label><Input type="number" min={0} value={rent} onChange={e => setRent(e.target.value)} placeholder="0" /></div>
                  <div><Label>Condomínio</Label><Input type="number" min={0} value={condo} onChange={e => setCondo(e.target.value)} placeholder="0" /></div>
                  <div><Label>IPTU mensal</Label><Input type="number" min={0} value={iptu} onChange={e => setIptu(e.target.value)} placeholder="0" /></div>
                  <div><Label>Seguro incêndio</Label><Input type="number" min={0} value={insurance} onChange={e => setInsurance(e.target.value)} placeholder="0" /></div>
                </div>
                <p className="text-xs font-semibold text-primary">
                  Total: {formatCurrency(computedAmount, simCurrency)}
                </p>
              </div>
            )}

            {simType === "credit_card" && (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-xs font-semibold text-muted-foreground">Cartão de crédito</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Fatura atual</Label><Input type="number" min={0} value={ccCurrent} onChange={e => setCcCurrent(e.target.value)} placeholder="0" /></div>
                  <div><Label>Novo valor simulado</Label><Input type="number" min={0} value={ccNew} onChange={e => setCcNew(e.target.value)} placeholder="0" /></div>
                </div>
                <p className="text-xs font-semibold text-primary">
                  Diferença: +{formatCurrency(computedAmount, simCurrency)}
                </p>
              </div>
            )}

            {simType !== "housing" && simType !== "credit_card" && (
              <div>
                <Label>Valor mensal</Label>
                <Input type="number" min={0} value={simAmount} onChange={e => setSimAmount(e.target.value)} placeholder="0" />
              </div>
            )}

            {(simType === "custom" || simType === "subscription" || simType === "financing" || simType === "health") && (
              <div>
                <Label>Descrição (opcional)</Label>
                <Input value={simDescription} onChange={e => setSimDescription(e.target.value)} placeholder="Detalhes adicionais" />
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duração da simulação</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "indefinite", label: "Indefinido" },
                  { value: "6months", label: "6 meses" },
                  { value: "1year", label: "1 ano" },
                  { value: "specific", label: "Período específico" },
                ].map(o => (
                  <button
                    key={o.value}
                    onClick={() => setSimDurationType(o.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                      simDurationType === o.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {simDurationType === "specific" && (
                <div className="flex gap-2 mt-2">
                  <Input type="number" min={1} value={simDurationValue} onChange={e => setSimDurationValue(e.target.value)} className="w-20" placeholder="6" />
                  <Select value={simDurationUnit} onValueChange={setSimDurationUnit}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="months">Meses</SelectItem>
                      <SelectItem value="years">Anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <Label>Categoria associada</Label>
              <Select value={simCategoryId} onValueChange={setSimCategoryId}>
                <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {expenseCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculate button */}
            <Button
              onClick={() => setShowResult(true)}
              variant="outline"
              className="w-full gap-2"
              disabled={computedAmount <= 0}
            >
              <Calculator className="h-4 w-4" />
              Calcular impacto
            </Button>

            {/* Result panel */}
            {showResult && computedAmount > 0 && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-bold text-foreground">📊 Resultado da simulação</p>

                <div className="grid grid-cols-2 gap-3">
                  {/* Card 1 - Monthly balance impact */}
                  <Card>
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <TrendingDown className="h-3.5 w-3.5" /> Saldo mensal
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <p>Renda: {formatCurrency(monthlyIncome, "BRL")}</p>
                        <p>Despesas atuais: {formatCurrency(currentExpenses, "BRL")}</p>
                        <p className="text-primary font-medium">Nova despesa: +{formatCurrency(computedAmount, simCurrency)}</p>
                      </div>
                      <p className={cn("text-sm font-bold tabular-nums", newBalance >= 0 ? "text-income" : "text-destructive")}>
                        {formatCurrency(newBalance, "BRL")}
                      </p>
                      {balanceChange > 0 && (
                        <p className="text-[10px] text-destructive">↓ -{balanceChange.toFixed(1)}%</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card 2 - Savings rate */}
                  <Card>
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <PiggyBank className="h-3.5 w-3.5" /> Taxa de poupança
                      </div>
                      <div className="text-[11px] space-y-0.5">
                        <p>Atual: {currentSavingsRate.toFixed(1)}%</p>
                        <p>Simulada: {newSavingsRate.toFixed(1)}%</p>
                      </div>
                      <p className={cn("text-sm font-bold", getSavingsLabel(newSavingsRate).color)}>
                        {getSavingsLabel(newSavingsRate).label}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Card 3 - Benchmark comparison */}
                  <Card>
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <BarChart3 className="h-3.5 w-3.5" /> % saudável
                      </div>
                      {benchmarkPct !== undefined && selectedCategory ? (
                        <>
                          <p className="text-[11px]">{selectedCategory.icon} {selectedCategory.name} — ideal: {benchmarkPct}%</p>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <span>Antes</span><span>Depois</span>
                            </div>
                            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary/40" style={{ width: `${Math.min((currentCategoryPct || 0), 100)}%` }} />
                            </div>
                            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                              <div className={cn("h-full rounded-full", (newCategoryPct || 0) > benchmarkPct ? "bg-destructive" : "bg-primary")} style={{ width: `${Math.min((newCategoryPct || 0), 100)}%` }} />
                            </div>
                          </div>
                          {(newCategoryPct || 0) > benchmarkPct && (
                            <p className="text-[10px] text-amber-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Acima do recomendado
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-[11px] text-muted-foreground">Selecione uma categoria para comparar com benchmarks</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card 4 - Projection */}
                  <Card>
                    <CardContent className="p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <CalendarDays className="h-3.5 w-3.5" /> Projeção do gasto
                      </div>
                      {totalCost !== null ? (
                        <p className="text-sm font-bold text-foreground tabular-nums">
                          {formatCurrency(totalCost, simCurrency)}
                          <span className="text-[10px] font-normal text-muted-foreground ml-1">em {durationMonths} meses</span>
                        </p>
                      ) : (
                        <div className="text-[11px] space-y-0.5">
                          <p>1 ano: {formatCurrency(computedAmount * 12, simCurrency)}</p>
                          <p>2 anos: {formatCurrency(computedAmount * 24, simCurrency)}</p>
                          <p>5 anos: {formatCurrency(computedAmount * 60, simCurrency)}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Diagnosis */}
                <div className={cn("rounded-lg border p-3 text-sm font-medium", diagnosis.color)}>
                  {diagnosis.icon} {diagnosis.text}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="flex-1">Salvar simulação</Button>
                  <Button variant="outline" onClick={() => { setSheetOpen(false); resetForm(); }} className="flex-1">Descartar</Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
