import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrency as baseFormatCurrency, type Currency } from "@/types/database";
import {
  calcPrice, calcPriceSchedule, calcSACSchedule,
  SIM_TYPE_META, getDiagnosisInfo,
  type SimulationType,
} from "@/lib/simulatorCalcs";
import {
  Calculator, Plus, Trash2, Archive, ChevronDown, ChevronUp,
  AlertTriangle, RotateCcw, Save, CheckCircle, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Legend,
  ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

function fmtCurrency(amount: number, currency: string): string {
  if (currency === "EUR") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "EUR" }).format(amount);
  return baseFormatCurrency(amount, currency as Currency);
}

interface DbCategory { id: string; name: string; icon: string; type: string; parent_id: string | null; }
interface Budget { id: string; category_id: string | null; name: string; amount: number; currency: string; period_month: string | null; }
interface Simulation {
  id: string; user_id: string; name: string; type: string; currency: string;
  monthly_amount: number; duration_type: string | null; duration_value: number | null;
  category_id: string | null; metadata: any; status: string; created_at: string;
  simulation_type: string | null; monthly_impact: number | null; diagnosis: string | null; horizon_months: number | null;
}

const SIM_TYPES: SimulationType[] = ['rent_change', 'car_loan', 'home_loan', 'subscription', 'salary_increase', 'income_loss'];

export default function Simulator() {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('all');

  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [currentExpenses, setCurrentExpenses] = useState(0);
  const [emergencyFund, setEmergencyFund] = useState(0);

  // Simulation state
  const [step, setStep] = useState<'type' | 'form' | 'result'>('type');
  const [simType, setSimType] = useState<SimulationType>('subscription');
  const [simName, setSimName] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);

  // ── Rent Change ──
  const [rentCurrent, setRentCurrent] = useState('');
  const [rentNew, setRentNew] = useState('');
  const [rentCondo, setRentCondo] = useState('');
  const [rentIptu, setRentIptu] = useState('');
  const [rentInsurance, setRentInsurance] = useState('');
  const [rentDuration, setRentDuration] = useState('indefinite');
  const [rentDurationCustom, setRentDurationCustom] = useState('12');
  const [rentMovingCost, setRentMovingCost] = useState('');
  const [rentCaution, setRentCaution] = useState('2');

  // ── Car Loan ──
  const [carValue, setCarValue] = useState('');
  const [carDown, setCarDown] = useState('');
  const [carDownPct, setCarDownPct] = useState(false);
  const [carTerm, setCarTerm] = useState([48]);
  const [carRate, setCarRate] = useState('1.49');
  const [carIpva, setCarIpva] = useState('');
  const [carInsuranceAnnual, setCarInsuranceAnnual] = useState('');
  const [carMaintenance, setCarMaintenance] = useState('');
  const [carFuel, setCarFuel] = useState('');

  // ── Home Loan ──
  const [homeValue, setHomeValue] = useState('');
  const [homeDown, setHomeDown] = useState('');
  const [homeDownPct, setHomeDownPct] = useState(false);
  const [homeSystem, setHomeSystem] = useState<'sac' | 'price' | 'mcmv'>('sac');
  const [homeTerm, setHomeTerm] = useState([30]);
  const [homeRate, setHomeRate] = useState('10.5');
  const [homeItbi, setHomeItbi] = useState('');
  const [homeCartorio, setHomeCartorio] = useState('');
  const [homeCondo, setHomeCondo] = useState('');
  const [homeIptu, setHomeIptu] = useState('');

  // ── Subscription ──
  const [subName, setSubName] = useState('');
  const [subValue, setSubValue] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [subDuration, setSubDuration] = useState('indefinite');
  const [subDurationCustom, setSubDurationCustom] = useState('12');

  // ── Salary Increase ──
  const [salaryNew, setSalaryNew] = useState('');
  const [salaryStartMonth, setSalaryStartMonth] = useState(format(new Date(), 'yyyy-MM'));

  // ── Income Loss ──
  const [lossNewIncome, setLossNewIncome] = useState('');
  const [lossDuration, setLossDuration] = useState('6');

  const currentMonth = format(new Date(), 'yyyy-MM');

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [simRes, catRes, budRes, profRes, invRes] = await Promise.all([
      supabase.from("simulations").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("budgets").select("*").eq("period_month", currentMonth),
      supabase.from("profiles").select("monthly_income_brl").eq("id", user.id).single(),
      supabase.from("investments").select("current_value, is_emergency_fund").eq("is_emergency_fund", true),
    ]);
    if (simRes.data) setSimulations(simRes.data as any[]);
    if (catRes.data) setCategories(catRes.data as DbCategory[]);
    if (budRes.data) {
      setBudgets(budRes.data as Budget[]);
      const expBudgets = (budRes.data as Budget[]);
      // Get expense category IDs
      const expCatIds = new Set((catRes.data as DbCategory[]).filter(c => c.type === 'expense').map(c => c.id));
      const totalExp = expBudgets.filter(b => b.category_id && expCatIds.has(b.category_id)).reduce((s, b) => s + b.amount, 0);
      setCurrentExpenses(totalExp);
    }
    if (profRes.data) setMonthlyIncome((profRes.data as any).monthly_income_brl || 0);
    if (invRes.data) setEmergencyFund((invRes.data as any[]).reduce((s: number, i: any) => s + (i.current_value || 0), 0));
    setLoading(false);
  }, [user, currentMonth]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Find rent budget automatically
  const rentBudget = useMemo(() => {
    const rentCat = categories.find(c => c.name.toLowerCase().includes('aluguel'));
    if (!rentCat) return null;
    return budgets.find(b => b.category_id === rentCat.id);
  }, [categories, budgets]);

  useEffect(() => {
    if (simType === 'rent_change' && rentBudget && !rentCurrent) {
      setRentCurrent(String(rentBudget.amount));
    }
  }, [simType, rentBudget]);

  // ── CALCULATIONS ──
  const computed = useMemo(() => {
    const inc = monthlyIncome;
    const exp = currentExpenses;
    const currentBalance = inc - exp;
    const currentSavingsRate = inc > 0 ? (currentBalance / inc) * 100 : 0;

    let monthlyImpact = 0;
    let incomeChange = 0;
    let horizonMonths = 12;
    let newExpenseLabel = '';
    let initialCost = 0;
    let totalPaid = 0;
    let totalInterest = 0;
    let schedule: any[] = [];

    if (simType === 'rent_change') {
      const oldRent = parseFloat(rentCurrent) || 0;
      const newTotal = (parseFloat(rentNew) || 0) + (parseFloat(rentCondo) || 0) + (parseFloat(rentIptu) || 0) + (parseFloat(rentInsurance) || 0);
      monthlyImpact = newTotal - oldRent;
      newExpenseLabel = 'Moradia (novo)';
      const dur = rentDuration === 'indefinite' ? 60 : rentDuration === 'custom' ? parseInt(rentDurationCustom) || 12 : parseInt(rentDuration);
      horizonMonths = dur;
      const moving = parseFloat(rentMovingCost) || 0;
      const cautionMonths = parseInt(rentCaution) || 0;
      initialCost = moving + cautionMonths * (parseFloat(rentNew) || 0);
    }

    else if (simType === 'car_loan') {
      const val = parseFloat(carValue) || 0;
      const downVal = carDownPct ? val * ((parseFloat(carDown) || 0) / 100) : (parseFloat(carDown) || 0);
      const financed = Math.max(0, val - downVal);
      const n = carTerm[0];
      const rate = (parseFloat(carRate) || 1.49) / 100;
      const pmt = calcPrice(financed, rate, n);
      horizonMonths = n;
      totalPaid = pmt * n;
      totalInterest = totalPaid - financed;
      const ipvaM = ((parseFloat(carIpva) || val * 0.04) / 12);
      const insM = ((parseFloat(carInsuranceAnnual) || 0) / 12);
      const maintM = parseFloat(carMaintenance) || 0;
      const fuelM = parseFloat(carFuel) || 0;
      const extras = ipvaM + insM + maintM + fuelM;
      monthlyImpact = pmt + (showAdvanced ? extras : 0);
      newExpenseLabel = 'Parcela + custos carro';
      initialCost = downVal;
      schedule = calcPriceSchedule(financed, rate, n);
    }

    else if (simType === 'home_loan') {
      const val = parseFloat(homeValue) || 0;
      const downVal = homeDownPct ? val * ((parseFloat(homeDown) || 0) / 100) : (parseFloat(homeDown) || 0);
      const financed = Math.max(0, val - downVal);
      const years = homeTerm[0];
      const n = years * 12;
      horizonMonths = n;
      let rateAnnual = parseFloat(homeRate) || (homeSystem === 'mcmv' ? 4.5 : 10.5);
      const monthlyRate = rateAnnual / 100 / 12;

      if (homeSystem === 'sac') {
        schedule = calcSACSchedule(financed, monthlyRate, n);
        monthlyImpact = schedule[0]?.payment || 0;
      } else {
        schedule = calcPriceSchedule(financed, monthlyRate, n);
        monthlyImpact = schedule[0]?.payment || 0;
      }

      totalPaid = schedule.reduce((s, r) => s + r.payment, 0);
      totalInterest = schedule.reduce((s, r) => s + r.interest, 0);

      if (showAdvanced) {
        const condoM = parseFloat(homeCondo) || 0;
        const iptuM = parseFloat(homeIptu) || 0;
        monthlyImpact += condoM + iptuM;
      }
      newExpenseLabel = 'Parcela imóvel';
      const itbi = parseFloat(homeItbi) || val * 0.02;
      const cart = parseFloat(homeCartorio) || val * 0.015;
      initialCost = downVal + (showAdvanced ? itbi + cart : 0);
    }

    else if (simType === 'subscription') {
      monthlyImpact = parseFloat(subValue) || 0;
      newExpenseLabel = subName || 'Nova assinatura';
      const dur = subDuration === 'indefinite' ? 60 : subDuration === 'custom' ? parseInt(subDurationCustom) || 12 : parseInt(subDuration);
      horizonMonths = dur;
    }

    else if (simType === 'salary_increase') {
      const newSal = parseFloat(salaryNew) || 0;
      incomeChange = newSal - inc;
      horizonMonths = 12;
    }

    else if (simType === 'income_loss') {
      const newInc = parseFloat(lossNewIncome) || 0;
      incomeChange = newInc - inc;
      horizonMonths = parseInt(lossDuration) || 6;
    }

    const newIncome = inc + incomeChange;
    const newExpenses = exp + monthlyImpact;
    const newBalance = newIncome - newExpenses;
    const newSavingsRate = newIncome > 0 ? (newBalance / newIncome) * 100 : 0;
    const diag = getDiagnosisInfo(newBalance, newSavingsRate);

    // Projection chart data
    const chartData = [];
    const now = new Date();
    const months = Math.min(horizonMonths, 60);
    for (let i = 0; i < months; i++) {
      const m = addMonths(now, i);
      const label = format(m, 'MMM yy', { locale: ptBR });
      let simPmt = monthlyImpact;
      if ((simType === 'home_loan' && homeSystem === 'sac') && schedule[i]) {
        simPmt = schedule[i].payment + (showAdvanced ? (parseFloat(homeCondo) || 0) + (parseFloat(homeIptu) || 0) : 0);
      }
      chartData.push({
        month: label,
        saldoAtual: Math.round(currentBalance),
        saldoSimulado: Math.round((inc + incomeChange) - (exp + simPmt)),
      });
    }

    // Emergency fund coverage
    const emergencyMonths = newExpenses > 0 ? emergencyFund / newExpenses : 0;

    return {
      monthlyImpact, incomeChange, newIncome, newExpenses, newBalance,
      currentBalance, currentSavingsRate, newSavingsRate,
      diag, chartData, horizonMonths, newExpenseLabel,
      initialCost, totalPaid, totalInterest, schedule,
      emergencyMonths,
    };
  }, [
    simType, monthlyIncome, currentExpenses, emergencyFund, showAdvanced,
    rentCurrent, rentNew, rentCondo, rentIptu, rentInsurance, rentDuration, rentDurationCustom, rentMovingCost, rentCaution,
    carValue, carDown, carDownPct, carTerm, carRate, carIpva, carInsuranceAnnual, carMaintenance, carFuel,
    homeValue, homeDown, homeDownPct, homeSystem, homeTerm, homeRate, homeItbi, homeCartorio, homeCondo, homeIptu,
    subValue, subName, subDuration, subDurationCustom,
    salaryNew, lossNewIncome, lossDuration,
  ]);

  const resetForm = () => {
    setStep('type'); setSimName(''); setShowAdvanced(false);
    setRentCurrent(''); setRentNew(''); setRentCondo(''); setRentIptu(''); setRentInsurance('');
    setRentDuration('indefinite'); setRentDurationCustom('12'); setRentMovingCost(''); setRentCaution('2');
    setCarValue(''); setCarDown(''); setCarDownPct(false); setCarTerm([48]); setCarRate('1.49');
    setCarIpva(''); setCarInsuranceAnnual(''); setCarMaintenance(''); setCarFuel('');
    setHomeValue(''); setHomeDown(''); setHomeDownPct(false); setHomeSystem('sac');
    setHomeTerm([30]); setHomeRate('10.5'); setHomeItbi(''); setHomeCartorio(''); setHomeCondo(''); setHomeIptu('');
    setSubName(''); setSubValue(''); setSubCategory(''); setSubDuration('indefinite'); setSubDurationCustom('12');
    setSalaryNew(''); setSalaryStartMonth(format(new Date(), 'yyyy-MM'));
    setLossNewIncome(''); setLossDuration('6');
  };

  const handleSave = async () => {
    const name = simName.trim() || SIM_TYPE_META[simType].label;
    const metadata: any = {};
    if (simType === 'rent_change') Object.assign(metadata, { rentCurrent: parseFloat(rentCurrent)||0, rentNew: parseFloat(rentNew)||0, condo: parseFloat(rentCondo)||0, iptu: parseFloat(rentIptu)||0, insurance: parseFloat(rentInsurance)||0 });
    if (simType === 'car_loan') Object.assign(metadata, { value: parseFloat(carValue)||0, down: parseFloat(carDown)||0, term: carTerm[0], rate: parseFloat(carRate)||0 });
    if (simType === 'home_loan') Object.assign(metadata, { value: parseFloat(homeValue)||0, down: parseFloat(homeDown)||0, system: homeSystem, termYears: homeTerm[0], rate: parseFloat(homeRate)||0 });
    if (simType === 'subscription') Object.assign(metadata, { serviceName: subName, value: parseFloat(subValue)||0 });
    if (simType === 'salary_increase') Object.assign(metadata, { newSalary: parseFloat(salaryNew)||0, startMonth: salaryStartMonth });
    if (simType === 'income_loss') Object.assign(metadata, { newIncome: parseFloat(lossNewIncome)||0, duration: parseInt(lossDuration)||6 });

    const { error } = await supabase.from("simulations").insert({
      user_id: user!.id, name, type: simType,
      simulation_type: simType, currency: 'BRL',
      monthly_amount: Math.abs(computed.monthlyImpact || computed.incomeChange),
      monthly_impact: computed.monthlyImpact || computed.incomeChange,
      diagnosis: computed.diag.key,
      horizon_months: computed.horizonMonths,
      metadata, status: 'active',
    } as any);
    if (error) { toast.error("Erro ao salvar"); console.error(error); return; }
    toast.success("Simulação salva!"); resetForm(); fetchAll();
  };

  const handleApplyToBudget = async () => {
    // For subscription, create a new budget entry
    if (simType === 'subscription' && subValue) {
      const { error } = await supabase.from("budgets").insert({
        user_id: user!.id, name: subName || 'Nova assinatura', currency: 'BRL',
        category_id: subCategory || null, amount: parseFloat(subValue),
        period: 'monthly', period_start_day: 1, period_month: currentMonth,
        is_recurring: true, updated_at: new Date().toISOString(),
      });
      if (error) { toast.error("Erro ao aplicar"); return; }
    }
    // For salary increase, update profile income
    if (simType === 'salary_increase' && salaryNew) {
      const { error } = await supabase.from("profiles").update({ monthly_income_brl: parseFloat(salaryNew) } as any).eq("id", user!.id);
      if (error) { toast.error("Erro ao atualizar renda"); return; }
    }
    toast.success("Aplicado ao orçamento!"); setConfirmApply(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("simulations").delete().eq("id", id);
    toast.success("Excluída"); fetchAll();
  };

  const handleArchive = async (id: string) => {
    await supabase.from("simulations").update({ status: "archived" } as any).eq("id", id);
    toast.success("Arquivada"); fetchAll();
  };

  const handleReopen = (sim: Simulation) => {
    const m = sim.metadata || {};
    const t = (sim.simulation_type || sim.type) as SimulationType;
    setSimType(t); setSimName(sim.name);
    if (t === 'rent_change') { setRentCurrent(String(m.rentCurrent||'')); setRentNew(String(m.rentNew||'')); setRentCondo(String(m.condo||'')); setRentIptu(String(m.iptu||'')); setRentInsurance(String(m.insurance||'')); }
    if (t === 'car_loan') { setCarValue(String(m.value||'')); setCarDown(String(m.down||'')); setCarTerm([m.term||48]); setCarRate(String(m.rate||1.49)); }
    if (t === 'home_loan') { setHomeValue(String(m.value||'')); setHomeDown(String(m.down||'')); setHomeSystem(m.system||'sac'); setHomeTerm([m.termYears||30]); setHomeRate(String(m.rate||10.5)); }
    if (t === 'subscription') { setSubName(m.serviceName||''); setSubValue(String(m.value||'')); }
    if (t === 'salary_increase') { setSalaryNew(String(m.newSalary||'')); }
    if (t === 'income_loss') { setLossNewIncome(String(m.newIncome||'')); setLossDuration(String(m.duration||6)); }
    setStep('result');
  };

  const filteredSims = simulations.filter(s => filterStatus === 'all' || s.status === filterStatus);
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // ────────── RENDER ──────────
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laboratório Financeiro</h1>
          <p className="text-sm text-muted-foreground mt-1">Simule decisões e veja o impacto no seu orçamento real</p>
        </div>
        {step !== 'type' && (
          <Button variant="outline" size="sm" onClick={resetForm} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Nova simulação
          </Button>
        )}
      </div>

      {/* Income warning */}
      {monthlyIncome <= 0 && (
        <Card className="mb-6 border-[hsl(var(--pending)/0.3)] bg-[hsl(var(--pending-bg))]">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[hsl(var(--pending))] flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-foreground">Configure sua renda em <a href="/orcamentos" className="text-primary underline">Orçamentos</a> para cálculos precisos.</p>
          </CardContent>
        </Card>
      )}

      {/* ═══ STEP 1: TYPE SELECTION ═══ */}
      {step === 'type' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {SIM_TYPES.map(t => {
              const meta = SIM_TYPE_META[t];
              return (
                <button key={t} onClick={() => { setSimType(t); setStep('form'); }}
                  className="rounded-xl border bg-card p-4 text-left hover:border-primary/40 hover:shadow-md transition-all group">
                  <span className="text-2xl block mb-2">{meta.icon}</span>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{meta.label}</p>
                </button>
              );
            })}
          </div>

          {/* Saved simulations */}
          {!loading && simulations.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-base font-bold text-foreground">Simulações salvas</h2>
                <div className="flex gap-1">
                  {(['all', 'active', 'archived'] as const).map(f => (
                    <button key={f} onClick={() => setFilterStatus(f)} className={cn(
                      "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors border",
                      filterStatus === f ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                    )}>
                      {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : 'Arquivadas'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredSims.map(sim => {
                  const meta = SIM_TYPE_META[(sim.simulation_type || sim.type) as SimulationType] || { icon: '📊', label: sim.type };
                  const diagInfo = sim.diagnosis ? getDiagnosisInfo(
                    sim.diagnosis === 'negative' ? -1 : sim.diagnosis === 'limit' ? 100 : sim.diagnosis === 'attention' ? 500 : 1000,
                    sim.diagnosis === 'ok' ? 20 : sim.diagnosis === 'attention' ? 5 : 0,
                  ) : null;
                  return (
                    <Card key={sim.id} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{meta.icon} {sim.name}</p>
                            <p className="text-[11px] text-muted-foreground">{meta.label} · {format(new Date(sim.created_at), 'dd MMM yyyy', { locale: ptBR })}</p>
                          </div>
                          {diagInfo && (
                            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                              diagInfo.key === 'ok' ? 'bg-[hsl(var(--income-bg))] text-income' :
                              diagInfo.key === 'attention' ? 'bg-[hsl(var(--pending-bg))] text-[hsl(var(--pending))]' :
                              'bg-[hsl(var(--expense-bg))] text-destructive'
                            )}>
                              {diagInfo.icon} {diagInfo.text.split('—')[0].trim()}
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-foreground tabular-nums">
                          {fmtCurrency(sim.monthly_amount, sim.currency)}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                        </p>
                        <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleReopen(sim)} className="rounded-md p-1.5 text-primary hover:bg-primary/10 transition-colors" title="Reabrir">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                          {sim.status === 'active' && (
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
            </div>
          )}

          {!loading && simulations.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <Calculator className="h-12 w-12 text-muted-foreground/40" />
                <p className="font-medium text-foreground">Selecione um tipo de simulação acima</p>
                <p className="text-sm text-muted-foreground">e veja como uma nova decisão impacta seu orçamento.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* ═══ STEP 2: FORM ═══ */}
      {step === 'form' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">{SIM_TYPE_META[simType].icon}</span>
              <div>
                <h2 className="text-lg font-bold text-foreground">{SIM_TYPE_META[simType].label}</h2>
                <p className="text-xs text-muted-foreground">Preencha os dados para calcular o impacto</p>
              </div>
            </div>

            <div className="space-y-4 max-w-lg">
              {/* Name */}
              <div>
                <Label>Nome da simulação</Label>
                <Input value={simName} onChange={e => setSimName(e.target.value)} placeholder={`Ex: ${SIM_TYPE_META[simType].label}`} />
              </div>

              {/* ── RENT CHANGE ── */}
              {simType === 'rent_change' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Aluguel atual {rentBudget && <span className="text-[10px] text-muted-foreground">(do orçamento)</span>}</Label>
                      <Input type="number" value={rentCurrent} onChange={e => setRentCurrent(e.target.value)} placeholder="0" />
                    </div>
                    <div><Label>Novo aluguel</Label><Input type="number" value={rentNew} onChange={e => setRentNew(e.target.value)} placeholder="0" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Condomínio</Label><Input type="number" value={rentCondo} onChange={e => setRentCondo(e.target.value)} placeholder="0" /></div>
                    <div><Label>IPTU/mês</Label><Input type="number" value={rentIptu} onChange={e => setRentIptu(e.target.value)} placeholder="0" /></div>
                    <div><Label>Seguro</Label><Input type="number" value={rentInsurance} onChange={e => setRentInsurance(e.target.value)} placeholder="0" /></div>
                  </div>
                  <p className="text-sm font-semibold text-primary">
                    Novo total: {fmtCurrency((parseFloat(rentNew)||0)+(parseFloat(rentCondo)||0)+(parseFloat(rentIptu)||0)+(parseFloat(rentInsurance)||0), 'BRL')}
                  </p>
                  <div>
                    <Label>Duração</Label>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {[{ v: 'indefinite', l: 'Indefinido' }, { v: '6', l: '6 meses' }, { v: '12', l: '12 meses' }, { v: '24', l: '24 meses' }, { v: 'custom', l: 'Personalizado' }].map(o => (
                        <button key={o.v} onClick={() => setRentDuration(o.v)} className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                          rentDuration === o.v ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                        )}>{o.l}</button>
                      ))}
                    </div>
                    {rentDuration === 'custom' && <Input type="number" className="w-24 mt-2" value={rentDurationCustom} onChange={e => setRentDurationCustom(e.target.value)} placeholder="12" />}
                  </div>
                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} Campos avançados
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Custo de mudança</Label><Input type="number" value={rentMovingCost} onChange={e => setRentMovingCost(e.target.value)} placeholder="0" /></div>
                        <div><Label>Meses de caução</Label><Input type="number" value={rentCaution} onChange={e => setRentCaution(e.target.value)} placeholder="2" /></div>
                      </div>
                      {computed.initialCost > 0 && (
                        <p className="text-xs font-medium text-foreground">💰 Desembolso inicial: {fmtCurrency(computed.initialCost, 'BRL')}</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}

              {/* ── CAR LOAN ── */}
              {simType === 'car_loan' && (
                <>
                  <div><Label>Valor do veículo</Label><Input type="number" value={carValue} onChange={e => setCarValue(e.target.value)} placeholder="0" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="flex items-center gap-2">Entrada
                        <button onClick={() => setCarDownPct(!carDownPct)} className="text-[10px] text-primary underline">{carDownPct ? 'Usar R$' : 'Usar %'}</button>
                      </Label>
                      <Input type="number" value={carDown} onChange={e => setCarDown(e.target.value)} placeholder={carDownPct ? '20' : '0'} />
                    </div>
                    <div>
                      <Label>Taxa juros/mês (%)</Label>
                      <Input type="number" step="0.01" value={carRate} onChange={e => setCarRate(e.target.value)} placeholder="1.49" />
                    </div>
                  </div>
                  <div>
                    <Label>Prazo: {carTerm[0]} meses</Label>
                    <Slider value={carTerm} onValueChange={setCarTerm} min={12} max={84} step={6} className="mt-2" />
                  </div>
                  {(parseFloat(carValue)||0) > 0 && (
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1">
                      <p className="text-sm font-bold text-primary">Parcela: {fmtCurrency(computed.monthlyImpact, 'BRL')}/mês</p>
                      <p className="text-xs text-muted-foreground">Total pago: {fmtCurrency(computed.totalPaid, 'BRL')} · Juros: {fmtCurrency(computed.totalInterest, 'BRL')}</p>
                    </div>
                  )}
                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} Custos adicionais
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>IPVA/ano</Label><Input type="number" value={carIpva} onChange={e => setCarIpva(e.target.value)} placeholder={String(Math.round((parseFloat(carValue)||0)*0.04))} /></div>
                        <div><Label>Seguro/ano</Label><Input type="number" value={carInsuranceAnnual} onChange={e => setCarInsuranceAnnual(e.target.value)} placeholder="0" /></div>
                        <div><Label>Manutenção/mês</Label><Input type="number" value={carMaintenance} onChange={e => setCarMaintenance(e.target.value)} placeholder="0" /></div>
                        <div><Label>Combustível/mês</Label><Input type="number" value={carFuel} onChange={e => setCarFuel(e.target.value)} placeholder="0" /></div>
                      </div>
                      {showAdvanced && computed.monthlyImpact > 0 && (
                        <p className="text-xs font-medium text-foreground">Custo real mensal: {fmtCurrency(computed.monthlyImpact, 'BRL')}</p>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}

              {/* ── HOME LOAN ── */}
              {simType === 'home_loan' && (
                <>
                  <div><Label>Valor do imóvel</Label><Input type="number" value={homeValue} onChange={e => setHomeValue(e.target.value)} placeholder="0" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="flex items-center gap-2">Entrada
                        <button onClick={() => setHomeDownPct(!homeDownPct)} className="text-[10px] text-primary underline">{homeDownPct ? 'Usar R$' : 'Usar %'}</button>
                      </Label>
                      <Input type="number" value={homeDown} onChange={e => setHomeDown(e.target.value)} placeholder={homeDownPct ? '20' : '0'} />
                      {homeDownPct && (parseFloat(homeDown)||0) < 20 && (parseFloat(homeDown)||0) > 0 && (
                        <p className="text-[10px] text-[hsl(var(--pending))] mt-1">⚠️ Recomendado mínimo 20% de entrada</p>
                      )}
                    </div>
                    <div>
                      <Label>Sistema</Label>
                      <Select value={homeSystem} onValueChange={v => { setHomeSystem(v as any); setHomeRate(v === 'mcmv' ? '4.5' : '10.5'); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sac">SAC (parcela decrescente)</SelectItem>
                          <SelectItem value="price">Price (parcela fixa)</SelectItem>
                          <SelectItem value="mcmv">Minha Casa Minha Vida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {homeSystem === 'mcmv' && (parseFloat(homeValue)||0) > 350000 && (
                    <p className="text-xs text-destructive">⚠️ MCMV: valor máximo do imóvel é R$ 350.000</p>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Prazo: {homeTerm[0]} anos</Label>
                      <Slider value={homeTerm} onValueChange={setHomeTerm} min={5} max={35} step={1} className="mt-2" />
                    </div>
                    <div>
                      <Label>Taxa juros/ano (%)</Label>
                      <Input type="number" step="0.1" value={homeRate} onChange={e => setHomeRate(e.target.value)} />
                    </div>
                  </div>
                  {(parseFloat(homeValue)||0) > 0 && (
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1">
                      <p className="text-sm font-bold text-primary">Parcela inicial: {fmtCurrency(computed.monthlyImpact, 'BRL')}/mês</p>
                      {homeSystem === 'sac' && <p className="text-[10px] text-muted-foreground">No sistema SAC a parcela diminui ao longo do tempo</p>}
                      <p className="text-xs text-muted-foreground">Total pago: {fmtCurrency(computed.totalPaid, 'BRL')} · Juros: {fmtCurrency(computed.totalInterest, 'BRL')}</p>
                    </div>
                  )}
                  <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                    <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                      {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} Custos adicionais
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>ITBI (2% padrão)</Label><Input type="number" value={homeItbi} onChange={e => setHomeItbi(e.target.value)} placeholder={String(Math.round((parseFloat(homeValue)||0)*0.02))} /></div>
                        <div><Label>Cartório (~1.5%)</Label><Input type="number" value={homeCartorio} onChange={e => setHomeCartorio(e.target.value)} placeholder={String(Math.round((parseFloat(homeValue)||0)*0.015))} /></div>
                        <div><Label>Condomínio/mês</Label><Input type="number" value={homeCondo} onChange={e => setHomeCondo(e.target.value)} placeholder="0" /></div>
                        <div><Label>IPTU/mês</Label><Input type="number" value={homeIptu} onChange={e => setHomeIptu(e.target.value)} placeholder="0" /></div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}

              {/* ── SUBSCRIPTION ── */}
              {simType === 'subscription' && (
                <>
                  <div><Label>Nome do serviço</Label><Input value={subName} onChange={e => setSubName(e.target.value)} placeholder="Netflix, Spotify..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Valor mensal</Label><Input type="number" value={subValue} onChange={e => setSubValue(e.target.value)} placeholder="0" /></div>
                    <div>
                      <Label>Categoria</Label>
                      <Select value={subCategory} onValueChange={setSubCategory}>
                        <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {expenseCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Duração</Label>
                    <div className="flex gap-2 flex-wrap mt-1">
                      {[{ v: 'indefinite', l: 'Indefinido' }, { v: '3', l: '3 meses' }, { v: '6', l: '6 meses' }, { v: '12', l: '12 meses' }, { v: 'custom', l: 'Personalizado' }].map(o => (
                        <button key={o.v} onClick={() => setSubDuration(o.v)} className={cn(
                          "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                          subDuration === o.v ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                        )}>{o.l}</button>
                      ))}
                    </div>
                    {subDuration === 'custom' && <Input type="number" className="w-24 mt-2" value={subDurationCustom} onChange={e => setSubDurationCustom(e.target.value)} />}
                  </div>
                </>
              )}

              {/* ── SALARY INCREASE ── */}
              {simType === 'salary_increase' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Renda atual</Label>
                      <Input type="number" value={String(monthlyIncome)} disabled className="bg-muted" />
                    </div>
                    <div><Label>Nova renda</Label><Input type="number" value={salaryNew} onChange={e => setSalaryNew(e.target.value)} placeholder="0" /></div>
                  </div>
                  {computed.incomeChange > 0 && (
                    <p className="text-sm font-medium text-income">+{fmtCurrency(computed.incomeChange, 'BRL')}/mês a mais</p>
                  )}
                </>
              )}

              {/* ── INCOME LOSS ── */}
              {simType === 'income_loss' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Renda atual</Label>
                      <Input type="number" value={String(monthlyIncome)} disabled className="bg-muted" />
                    </div>
                    <div><Label>Nova renda (0 = demissão)</Label><Input type="number" value={lossNewIncome} onChange={e => setLossNewIncome(e.target.value)} placeholder="0" /></div>
                  </div>
                  <div><Label>Duração estimada (meses)</Label><Input type="number" value={lossDuration} onChange={e => setLossDuration(e.target.value)} placeholder="6" /></div>
                  {emergencyFund > 0 && (
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                      <p className="text-xs font-medium text-foreground">🛡️ Reserva de emergência: {fmtCurrency(emergencyFund, 'BRL')}</p>
                      <p className="text-xs text-muted-foreground">Cobre {computed.emergencyMonths.toFixed(1)} meses das despesas simuladas</p>
                    </div>
                  )}
                </>
              )}

              <Button onClick={() => setStep('result')} className="w-full gap-2" disabled={
                (simType === 'subscription' && !(parseFloat(subValue)||0)) ||
                (simType === 'car_loan' && !(parseFloat(carValue)||0)) ||
                (simType === 'home_loan' && !(parseFloat(homeValue)||0)) ||
                (simType === 'rent_change' && !(parseFloat(rentNew)||0)) ||
                (simType === 'salary_increase' && !(parseFloat(salaryNew)||0)) ||
                (simType === 'income_loss' && lossNewIncome === '')
              }>
                <Calculator className="h-4 w-4" /> Calcular impacto <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ STEP 3: IMPACT DASHBOARD ═══ */}
      {step === 'result' && (
        <div className="space-y-6">
          {/* Back to form */}
          <button onClick={() => setStep('form')} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            ← Editar parâmetros
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT COLUMN — Summary */}
            <div className="space-y-4">
              {/* Before vs After */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-bold text-foreground mb-3">Antes vs Depois</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left p-2 font-semibold text-muted-foreground">Item</th>
                          <th className="text-right p-2 font-semibold text-muted-foreground">Atual</th>
                          <th className="text-right p-2 font-semibold text-muted-foreground">Simulado</th>
                          <th className="text-right p-2 font-semibold text-muted-foreground">Diferença</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2 text-foreground">Renda mensal</td>
                          <td className="p-2 text-right tabular-nums">{fmtCurrency(monthlyIncome, 'BRL')}</td>
                          <td className="p-2 text-right tabular-nums">{fmtCurrency(computed.newIncome, 'BRL')}</td>
                          <td className={cn("p-2 text-right tabular-nums font-medium", computed.incomeChange > 0 ? "text-income" : computed.incomeChange < 0 ? "text-destructive" : "")}>
                            {computed.incomeChange !== 0 ? `${computed.incomeChange > 0 ? '+' : ''}${fmtCurrency(computed.incomeChange, 'BRL')}` : '—'}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2 text-foreground">Total despesas</td>
                          <td className="p-2 text-right tabular-nums">{fmtCurrency(currentExpenses, 'BRL')}</td>
                          <td className="p-2 text-right tabular-nums">{fmtCurrency(computed.newExpenses, 'BRL')}</td>
                          <td className={cn("p-2 text-right tabular-nums font-medium", computed.monthlyImpact > 0 ? "text-destructive" : computed.monthlyImpact < 0 ? "text-income" : "")}>
                            {computed.monthlyImpact !== 0 ? `+${fmtCurrency(computed.monthlyImpact, 'BRL')}` : '—'}
                          </td>
                        </tr>
                        <tr className="border-t bg-muted/30">
                          <td className="p-2 font-bold text-foreground">Saldo mensal</td>
                          <td className="p-2 text-right tabular-nums font-bold">{fmtCurrency(computed.currentBalance, 'BRL')}</td>
                          <td className={cn("p-2 text-right tabular-nums font-bold", computed.newBalance >= 0 ? "text-income" : "text-destructive")}>{fmtCurrency(computed.newBalance, 'BRL')}</td>
                          <td className={cn("p-2 text-right tabular-nums font-bold", computed.newBalance < computed.currentBalance ? "text-destructive" : "text-income")}>
                            {fmtCurrency(computed.newBalance - computed.currentBalance, 'BRL')}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2 text-foreground">Taxa de poupança</td>
                          <td className="p-2 text-right tabular-nums">{computed.currentSavingsRate.toFixed(1)}%</td>
                          <td className="p-2 text-right tabular-nums">{computed.newSavingsRate.toFixed(1)}%</td>
                          <td className={cn("p-2 text-right tabular-nums font-medium", computed.newSavingsRate < computed.currentSavingsRate ? "text-destructive" : "text-income")}>
                            {(computed.newSavingsRate - computed.currentSavingsRate).toFixed(1)}%
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  {/* Diagnosis badge */}
                  <div className={cn("mt-4 rounded-lg border p-3 text-sm font-semibold", computed.diag.cls)}>
                    {computed.diag.icon} {computed.diag.text}
                  </div>
                </CardContent>
              </Card>

              {/* Initial Cost (for loans/rent) */}
              {computed.initialCost > 0 && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-bold text-foreground mb-2">💰 Desembolso inicial</h3>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{fmtCurrency(computed.initialCost, 'BRL')}</p>
                    <p className="text-xs text-muted-foreground mt-1">Você precisará ter esse valor disponível para essa mudança</p>
                  </CardContent>
                </Card>
              )}

              {/* Extended projection for loans */}
              {(simType === 'car_loan' || simType === 'home_loan') && computed.totalPaid > 0 && (
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-sm font-bold text-foreground">📋 Em {Math.round(computed.horizonMonths / 12)} anos você terá pago</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Total de parcelas</span><span className="font-bold tabular-nums">{fmtCurrency(computed.totalPaid, 'BRL')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total de juros</span><span className="font-bold text-destructive tabular-nums">{fmtCurrency(computed.totalInterest, 'BRL')}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Custo efetivo sobre o valor</span><span className="font-bold tabular-nums">{((computed.totalInterest / (computed.totalPaid - computed.totalInterest)) * 100).toFixed(0)}%</span></div>
                    </div>
                    {simType === 'car_loan' && monthlyIncome > 0 && (
                      <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                        🚗 Esse carro te custará {fmtCurrency(computed.monthlyImpact, 'BRL')}/mês — {(computed.monthlyImpact / monthlyIncome * 100).toFixed(0)}% da sua renda.
                      </p>
                    )}
                    {simType === 'home_loan' && (
                      <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                        🏡 Ao final você terá pago {fmtCurrency(computed.totalInterest, 'BRL')} em juros. O imóvel precisará valorizar {((computed.totalInterest / (parseFloat(homeValue) || 1)) * 100).toFixed(0)}% para cobrir os juros.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Income loss — emergency coverage */}
              {simType === 'income_loss' && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-bold text-foreground mb-2">🛡️ Cobertura da reserva</h3>
                    <p className="text-2xl font-bold tabular-nums text-foreground">{computed.emergencyMonths.toFixed(1)} meses</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sua reserva de {fmtCurrency(emergencyFund, 'BRL')} cobre {computed.emergencyMonths.toFixed(1)} meses das despesas
                    </p>
                    <div className={cn("mt-2 text-xs font-semibold",
                      computed.emergencyMonths >= parseInt(lossDuration) ? "text-income" : "text-destructive"
                    )}>
                      {computed.emergencyMonths >= parseInt(lossDuration) ? '✅ Reserva suficiente para o período' : '🔴 Reserva insuficiente — planeje alternativas'}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN — Chart */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-bold text-foreground mb-4">📊 Projeção mês a mês</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={computed.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <ReTooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '11px' }}
                        formatter={(v: number, name: string) => [fmtCurrency(v, 'BRL'), name === 'saldoAtual' ? 'Saldo atual' : 'Saldo simulado']}
                      />
                      <Legend formatter={(v: string) => v === 'saldoAtual' ? 'Atual' : 'Simulado'} wrapperStyle={{ fontSize: '11px' }} />
                      <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                      <Bar dataKey="saldoAtual" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.4} />
                      <Bar dataKey="saldoSimulado" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Month-by-month table for loans */}
              {(simType === 'car_loan' || simType === 'home_loan') && computed.schedule.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                    <ChevronDown className="h-3 w-3" /> Tabela de amortização ({computed.schedule.length} meses)
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Card className="mt-2">
                      <CardContent className="p-0 max-h-64 overflow-y-auto">
                        <table className="w-full text-[10px]">
                          <thead className="sticky top-0 bg-card">
                            <tr className="border-b">
                              <th className="p-1.5 text-left text-muted-foreground">Mês</th>
                              <th className="p-1.5 text-right text-muted-foreground">Parcela</th>
                              <th className="p-1.5 text-right text-muted-foreground">Juros</th>
                              <th className="p-1.5 text-right text-muted-foreground">Amort.</th>
                              <th className="p-1.5 text-right text-muted-foreground">Saldo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {computed.schedule.slice(0, 60).map((r: any) => (
                              <tr key={r.month} className="border-b">
                                <td className="p-1.5">{r.month}</td>
                                <td className="p-1.5 text-right tabular-nums">{fmtCurrency(r.payment, 'BRL')}</td>
                                <td className="p-1.5 text-right tabular-nums text-destructive">{fmtCurrency(r.interest, 'BRL')}</td>
                                <td className="p-1.5 text-right tabular-nums text-income">{fmtCurrency(r.amortization, 'BRL')}</td>
                                <td className="p-1.5 text-right tabular-nums">{fmtCurrency(r.balance, 'BRL')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Salvar simulação</Button>
            {(simType === 'subscription' || simType === 'salary_increase') && (
              <Button variant="outline" onClick={() => setConfirmApply(true)} className="gap-2">
                <CheckCircle className="h-4 w-4" /> Aplicar ao orçamento
              </Button>
            )}
            <Button variant="ghost" onClick={resetForm}>Nova simulação</Button>
          </div>
        </div>
      )}

      {/* Confirm apply dialog */}
      <Dialog open={confirmApply} onOpenChange={setConfirmApply}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar ao orçamento?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Isso atualizará seu orçamento de {format(new Date(), 'MMMM yyyy', { locale: ptBR })}. Confirmar?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApply(false)}>Cancelar</Button>
            <Button onClick={handleApplyToBudget}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
