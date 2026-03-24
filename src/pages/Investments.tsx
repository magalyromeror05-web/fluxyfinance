import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatCurrency, type Currency } from "@/data/mockData";
import { Plus, Pencil, Trash2, TrendingUp, CalendarIcon, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  institution: string | null;
  currency: string;
  invested_amount: number;
  current_value: number;
  expected_return_pct: number | null;
  maturity_date: string | null;
  notes: string | null;
  is_emergency_fund: boolean;
  created_at: string;
  updated_at: string;
}

const TYPE_OPTIONS = [
  { value: "fixed_income", label: "Renda fixa", icon: "🏦", desc: "CDB, LCI, LCA, Tesouro" },
  { value: "stocks", label: "Ações e FIIs", icon: "📈", desc: "Bolsa de valores" },
  { value: "savings", label: "Poupança", icon: "💰", desc: "Conta poupança" },
  { value: "crypto", label: "Criptomoedas", icon: "₿", desc: "Bitcoin, Ethereum..." },
  { value: "emergency_fund", label: "Fundo de emergência", icon: "🛡️", desc: "Reserva de segurança" },
  { value: "pension", label: "Previdência", icon: "🏛️", desc: "PGBL / VGBL" },
];

const typeInfo = (t: string) => TYPE_OPTIONS.find(o => o.value === t) || { value: t, label: t, icon: "📊", desc: "" };

const CURRENCIES = ["BRL", "USD", "EUR"] as const;

export default function Investments() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  // Form
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("fixed_income");
  const [formInstitution, setFormInstitution] = useState("");
  const [formCurrency, setFormCurrency] = useState<Currency>("BRL");
  const [formInvested, setFormInvested] = useState("");
  const [formCurrent, setFormCurrent] = useState("");
  const [formReturn, setFormReturn] = useState("");
  const [formMaturity, setFormMaturity] = useState<Date | undefined>();
  const [formEmergency, setFormEmergency] = useState(false);
  const [formNotes, setFormNotes] = useState("");

  const fetchAll = async () => {
    const [invRes, profileRes] = await Promise.all([
      supabase.from("investments").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("monthly_income_brl").eq("id", user!.id).single(),
    ]);
    if (invRes.data) setInvestments(invRes.data as Investment[]);
    if (profileRes.data) setMonthlyIncome((profileRes.data as any).monthly_income_brl || 0);
    setLoading(false);
  };

  useEffect(() => { if (user) fetchAll(); }, [user]);

  // Summary calculations
  const totalInvested = investments.reduce((s, i) => s + i.invested_amount, 0);
  const totalCurrent = investments.reduce((s, i) => s + i.current_value, 0);
  const totalReturn = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;
  const emergencyFund = investments.filter(i => i.is_emergency_fund).reduce((s, i) => s + i.current_value, 0);
  const emergencyMonths = monthlyIncome > 0 ? emergencyFund / monthlyIncome : 0;

  // Distribution by type
  const distribution = useMemo(() => {
    const map = new Map<string, number>();
    investments.forEach(i => map.set(i.type, (map.get(i.type) || 0) + i.current_value));
    return TYPE_OPTIONS
      .map(t => ({ ...t, amount: map.get(t.value) || 0, pct: totalCurrent > 0 ? ((map.get(t.value) || 0) / totalCurrent) * 100 : 0 }))
      .filter(t => t.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [investments, totalCurrent]);

  // Grouped by type
  const grouped = useMemo(() => {
    const map = new Map<string, Investment[]>();
    investments.forEach(i => {
      if (!map.has(i.type)) map.set(i.type, []);
      map.get(i.type)!.push(i);
    });
    return TYPE_OPTIONS
      .filter(t => map.has(t.value))
      .map(t => ({ ...t, items: map.get(t.value)! }));
  }, [investments]);

  const resetForm = () => {
    setFormName(""); setFormType("fixed_income"); setFormInstitution("");
    setFormCurrency("BRL"); setFormInvested(""); setFormCurrent("");
    setFormReturn(""); setFormMaturity(undefined); setFormEmergency(false);
    setFormNotes(""); setEditing(null);
  };

  const openCreate = () => { resetForm(); setSheetOpen(true); };

  const openEdit = (inv: Investment) => {
    setEditing(inv);
    setFormName(inv.name);
    setFormType(inv.type);
    setFormInstitution(inv.institution || "");
    setFormCurrency(inv.currency as Currency);
    setFormInvested(String(inv.invested_amount));
    setFormCurrent(String(inv.current_value));
    setFormReturn(inv.expected_return_pct != null ? String(inv.expected_return_pct) : "");
    setFormMaturity(inv.maturity_date ? new Date(inv.maturity_date) : undefined);
    setFormEmergency(inv.is_emergency_fund);
    setFormNotes(inv.notes || "");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formInvested) { toast.error("Preencha nome e valor investido"); return; }
    const payload = {
      user_id: user!.id,
      name: formName.trim(),
      type: formType,
      institution: formInstitution.trim() || null,
      currency: formCurrency,
      invested_amount: parseFloat(formInvested) || 0,
      current_value: parseFloat(formCurrent) || parseFloat(formInvested) || 0,
      expected_return_pct: formReturn ? parseFloat(formReturn) : null,
      maturity_date: formMaturity ? format(formMaturity, "yyyy-MM-dd") : null,
      is_emergency_fund: formEmergency,
      notes: formNotes.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from("investments").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Investimento atualizado");
    } else {
      const { error } = await supabase.from("investments").insert(payload);
      if (error) { toast.error("Erro ao registrar"); console.error(error); return; }
      toast.success("Investimento registrado");
    }
    setSheetOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Investimento excluído"); fetchAll();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Investimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Seu patrimônio organizado em um só lugar</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Registrar investimento
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground mb-1">Total investido</p>
            <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(totalInvested, "BRL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground mb-1">Valor atual</p>
            <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(totalCurrent, "BRL")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-[11px] text-muted-foreground mb-1">Rentabilidade</p>
            <p className={cn("text-lg font-bold tabular-nums", totalReturn >= 0 ? "text-income" : "text-destructive")}>
              {totalReturn >= 0 ? "+" : ""}{totalReturn.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Shield className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-[11px] text-muted-foreground mb-1">Fundo de emergência</p>
            <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(emergencyFund, "BRL")}</p>
            <p className={cn("text-[10px] font-medium",
              emergencyMonths >= 6 ? "text-income" : emergencyMonths >= 3 ? "text-amber-600" : "text-destructive"
            )}>
              {emergencyMonths.toFixed(1)} meses de reserva
              {emergencyMonths >= 6 ? " 🟢" : emergencyMonths >= 3 ? " 🟡" : " 🔴"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution */}
      {distribution.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-foreground mb-3">📊 Distribuição por tipo</p>
            <div className="space-y-2.5">
              {distribution.map(d => (
                <div key={d.value} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">{d.icon} {d.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatCurrency(d.amount, "BRL")} · {d.pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(d.pct, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped list */}
      {investments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <TrendingUp className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <p className="font-medium text-foreground">Nenhum investimento registrado</p>
              <p className="text-sm text-muted-foreground mt-1">Registre seus investimentos para acompanhar seu patrimônio.</p>
            </div>
            <Button onClick={openCreate} size="sm" className="gap-2"><Plus className="h-4 w-4" /> Registrar</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(group => {
            const groupTotal = group.items.reduce((s, i) => s + i.current_value, 0);
            return (
              <div key={group.value}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{group.icon}</span>
                    <span className="text-sm font-semibold text-foreground">{group.label}</span>
                    <span className="text-xs text-muted-foreground">({group.items.length})</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(groupTotal, "BRL")}</span>
                </div>
                <div className="grid gap-3">
                  {group.items.map(inv => {
                    const returnPct = inv.invested_amount > 0
                      ? ((inv.current_value - inv.invested_amount) / inv.invested_amount) * 100
                      : 0;
                    const daysToMaturity = inv.maturity_date
                      ? differenceInDays(new Date(inv.maturity_date), new Date())
                      : null;

                    return (
                      <Card key={inv.id} className="group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-foreground truncate">{inv.name}</p>
                                {inv.is_emergency_fund && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">🛡️ Reserva</span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {inv.institution || "—"} · {inv.currency}
                                {inv.expected_return_pct != null && ` · ${inv.expected_return_pct}% a.a.`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(inv)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button onClick={() => handleDelete(inv.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-3">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Investido</p>
                              <p className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(inv.invested_amount, inv.currency as Currency)}</p>
                            </div>
                            <div className="text-muted-foreground">→</div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Atual</p>
                              <p className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(inv.current_value, inv.currency as Currency)}</p>
                            </div>
                            <span className={cn(
                              "text-xs font-semibold px-2 py-0.5 rounded-full ml-auto",
                              returnPct >= 0 ? "bg-income/10 text-income" : "bg-destructive/10 text-destructive"
                            )}>
                              {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
                            </span>
                          </div>

                          {daysToMaturity !== null && (
                            <p className={cn(
                              "text-[11px] font-medium mt-2",
                              daysToMaturity <= 0 ? "text-destructive" : daysToMaturity <= 30 ? "text-amber-600" : "text-income"
                            )}>
                              {daysToMaturity <= 0
                                ? "⏰ Vencido"
                                : `📅 Vence em ${daysToMaturity} dias (${format(new Date(inv.maturity_date!), "dd/MM/yyyy")})`}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sheet form */}
      <Sheet open={sheetOpen} onOpenChange={(o) => { setSheetOpen(o); if (!o) resetForm(); }}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? "Editar Investimento" : "Registrar Investimento"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Nome</Label>
              <Input placeholder='Ex: "CDB Nubank 12% a.a."' value={formName} onChange={e => setFormName(e.target.value)} />
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Instituição</Label>
              <Input placeholder="Ex: Nubank, XP, Binance" value={formInstitution} onChange={e => setFormInstitution(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Moeda</Label>
                <Select value={formCurrency} onValueChange={v => setFormCurrency(v as Currency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rentabilidade esperada (% a.a.)</Label>
                <Input type="number" placeholder="12" value={formReturn} onChange={e => setFormReturn(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor investido</Label>
                <Input type="number" placeholder="0.00" value={formInvested} onChange={e => setFormInvested(e.target.value)} />
              </div>
              <div>
                <Label>Valor atual</Label>
                <Input type="number" placeholder="0.00" value={formCurrent} onChange={e => setFormCurrent(e.target.value)} />
              </div>
            </div>

            {formType === "fixed_income" && (
              <div>
                <Label>Data de vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formMaturity && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formMaturity ? format(formMaturity, "PPP", { locale: ptBR }) : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={formMaturity} onSelect={setFormMaturity} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Switch checked={formEmergency} onCheckedChange={setFormEmergency} />
              <Label className="cursor-pointer">É fundo de emergência?</Label>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea placeholder="Observações opcionais..." value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} />
            </div>

            <Button onClick={handleSave} className="w-full">
              {editing ? "Salvar Alterações" : "Registrar Investimento"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
