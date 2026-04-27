import { useEffect, useMemo, useState } from "react";
import { useExchangeRates, type ExchangeRate } from "@/hooks/useExchangeRates";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeftRight, AlertTriangle, ChevronDown, HelpCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";

export const IOF_RATES = {
  cartao_credito: 3.50,
  cartao_debito: 3.50,
  cartao_prepago: 3.50,
  especie: 3.50,
  remessa_pessoal: 3.50,
  remessa_educacao: 3.50,
  remessa_investimento: 1.10,
  entrada_exterior: 0.38,
  retorno_investimento: 0,
};

const OPERATION_TYPES = [
  { value: "cartao_credito", label: "🛒 Cartão de crédito internacional" },
  { value: "cartao_debito", label: "💳 Cartão de débito/pré-pago" },
  { value: "especie", label: "💵 Moeda em espécie / cheque viagem" },
  { value: "remessa_pessoal", label: "📤 Remessa pessoal ao exterior" },
  { value: "remessa_educacao", label: "🎓 Remessa educacional / intercâmbio" },
  { value: "remessa_investimento", label: "📈 Remessa para investimento" },
  { value: "entrada_exterior", label: "📥 Recebimento do exterior" },
] as const;

const CURRENCIES = [
  { code: "BRL", flag: "🇧🇷", name: "Real" },
  { code: "USD", flag: "🇺🇸", name: "Dólar" },
  { code: "EUR", flag: "🇪🇺", name: "Euro" },
  { code: "GBP", flag: "🇬🇧", name: "Libra" },
  { code: "PYG", flag: "🇵🇾", name: "Guarani" },
  { code: "ARS", flag: "🇦🇷", name: "Peso AR" },
];

const SOURCE_LABELS: Record<string, string> = {
  awesome: "AwesomeAPI — tempo real",
  bcb: "Cotação PTAX — Banco Central do Brasil",
  fallback: "Cotação estimada — fallback local",
};

type HistoryPoint = { date: string; compra: number; venda: number };

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32 h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.flag} {c.code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function timeAgo(date: Date | null): string {
  if (!date) return "—";
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  return `há ${Math.floor(mins / 60)}h`;
}

function formatBrl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatBcbDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${mm}-${dd}-${date.getFullYear()}`;
}

function getBrlRate(from: string, to: string, rates: Record<string, ExchangeRate>) {
  if (from === "BRL" && to !== "BRL") return rates[to] ? 1 / rates[to].bid : 0;
  if (to === "BRL" && from !== "BRL") return rates[from]?.bid ?? 0;
  if (from !== "BRL" && to !== "BRL") return rates[from]?.bid ?? 0;
  return 1;
}

async function fetchHistory(currency: string, days: number): Promise<HistoryPoint[]> {
  if (currency === "BRL") return [];
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days - 10);
  const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(dataInicial=@di,dataFinal=@df,moeda=@m)?@di='${formatBcbDate(start)}'&@df='${formatBcbDate(end)}'&@m='${currency}'&$format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar histórico PTAX");
  const data = await res.json();
  return (data.value ?? [])
    .slice(-days)
    .map((item: any) => ({
      date: new Date(item.dataHoraCotacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      compra: Number(item.cotacaoCompra),
      venda: Number(item.cotacaoVenda),
    }));
}

function ExchangeHistoryChart({ from, to }: { from: string; to: string }) {
  const [range, setRange] = useState(30);
  const chartCurrency = from === "BRL" ? to : from;
  const enabled = chartCurrency !== "BRL";
  const { data = [], isLoading } = useQuery({
    queryKey: ["exchange-history", chartCurrency, range],
    queryFn: () => fetchHistory(chartCurrency, range),
    enabled,
    staleTime: 30 * 60 * 1000,
  });

  if (!enabled) return null;

  return (
    <div className="rounded-lg border border-border p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-foreground">Histórico PTAX — {chartCurrency}/BRL</p>
          <p className="text-[11px] text-muted-foreground">Compra e venda oficiais do Banco Central</p>
        </div>
        <div className="flex rounded-md border border-border overflow-hidden">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setRange(d)} className={cn("px-2 py-1 text-[11px]", range === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{d}d</button>
          ))}
        </div>
      </div>
      <div className="h-40 w-full">
        {isLoading ? (
          <div className="h-full grid place-items-center text-xs text-muted-foreground">Carregando histórico...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={16} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={42} domain={["dataMin", "dataMax"]} />
              <ChartTooltip formatter={(value: number) => value.toFixed(4)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="compra" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Compra" />
              <Line type="monotone" dataKey="venda" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} name="Venda" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function OperationCosts({ amount, from, to, rates, converted }: { amount: number; from: string; to: string; rates: Record<string, ExchangeRate>; converted: number }) {
  const [open, setOpen] = useState(false);
  const [includeCosts, setIncludeCosts] = useState(true);
  const [operation, setOperation] = useState<keyof typeof IOF_RATES>("cartao_credito");
  const [spread, setSpread] = useState("2");
  const [fixedFee, setFixedFee] = useState("0");
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (open && from === "BRL") {
      setPulse(true);
      const id = window.setTimeout(() => setPulse(false), 1400);
      return () => window.clearTimeout(id);
    }
  }, [open, from]);

  const spreadPct = Number(spread) || 0;
  const fee = Number(fixedFee) || 0;
  const commercialRate = getBrlRate(from, to, rates);
  const rateWithSpread = commercialRate * (1 + spreadPct / 100);
  const iofPct = IOF_RATES[operation] ?? 0;
  const iofAmount = from === "BRL" && includeCosts ? amount * (iofPct / 100) : 0;
  const totalCostBRL = from === "BRL" ? amount + amount * (spreadPct / 100) + iofAmount + fee : converted * (1 - spreadPct / 100) - fee;
  const receive = from === "BRL" && to !== "BRL" ? Math.max(0, (amount - iofAmount - fee) / rateWithSpread) : Math.max(0, converted * (1 - spreadPct / 100) - fee);
  const impact = converted > 0 ? ((receive - converted) / converted) * 100 : 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted/60 transition-colors">
          <span>Incluir custos da operação</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        {from === "ARS" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>O câmbio do Peso Argentino pode ter variações significativas entre a taxa oficial e a taxa de mercado. Consulte sua instituição financeira para o custo real da operação.</span>
          </div>
        ) : (
          <div className="rounded-lg border border-border p-3 space-y-3">
            {from === "BRL" && (
              <label className="flex items-center justify-between gap-3 text-xs font-medium text-foreground">
                <span>Incluir IOF no cálculo</span>
                <input type="checkbox" checked={includeCosts} onChange={(e) => setIncludeCosts(e.target.checked)} className="h-4 w-4 accent-primary" />
              </label>
            )}

            {from === "BRL" && (
              <div className={cn("space-y-1 rounded-md", pulse && "animate-pulse ring-2 ring-primary/40")}>
                <label className="text-xs font-medium text-muted-foreground">Tipo de operação</label>
                <Select value={operation} onValueChange={(v) => setOperation(v as keyof typeof IOF_RATES)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPERATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label} ({IOF_RATES[type.value].toFixed(2)}%)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Spread do banco/corretora (%)</label>
                <Input type="number" value={spread} onChange={(e) => setSpread(e.target.value)} step="0.1" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tarifa fixa (R$)</label>
                <Input type="number" value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} step="0.01" />
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Taxa comercial (PTAX):</span><strong>R$ {commercialRate.toFixed(4)}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Taxa c/ spread ({spreadPct.toFixed(1)}%):</span><strong>R$ {rateWithSpread.toFixed(4)}</strong></div>
              {from === "BRL" && includeCosts && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground inline-flex items-center gap-1">IOF ({iofPct.toFixed(2)}%)
                    <TooltipProvider><Tooltip><TooltipTrigger asChild><HelpCircle className="h-3 w-3" /></TooltipTrigger><TooltipContent className="max-w-56">Imposto sobre Operações Financeiras, cobrado pelo governo federal em transações cambiais.</TooltipContent></Tooltip></TooltipProvider>
                  </span>
                  <strong>{formatBrl(iofAmount)}</strong>
                </div>
              )}
              <div className="flex justify-between"><span className="text-muted-foreground">Tarifa fixa:</span><strong>{formatBrl(fee)}</strong></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between text-sm"><span className="font-semibold">{from === "BRL" ? "Custo total:" : "Valor com spread:"}</span><strong>{from === "BRL" ? formatBrl(totalCostBRL) : receive.toLocaleString("pt-BR", { maximumFractionDigits: 4 }) + ` ${to}`}</strong></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Você receberá:</span><strong>{receive.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {to}</strong></div>
              <div className={cn("flex justify-between font-medium", impact < 0 ? "text-expense" : "text-income")}><span>vs câmbio comercial:</span><span>{impact.toFixed(2)}%</span></div>
            </div>

            {from === "BRL" ? (
              <p className="text-[11px] text-muted-foreground">Alíquotas de IOF conforme Decreto nº 12.499/2025. Consulte sua instituição financeira para confirmação. <IofTableModal /></p>
            ) : (
              <p className="text-[11px] text-muted-foreground">Seu país pode ter tributação específica sobre câmbio. Consulte sua instituição financeira.</p>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function IofTableModal() {
  return (
    <Dialog>
      <DialogTrigger asChild><button className="text-primary hover:underline">Ver tabela completa de IOF →</button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Tabela de IOF</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          {Object.entries(IOF_RATES).map(([key, rate]) => (
            <div key={key} className="flex justify-between border-b border-border/60 py-2"><span className="capitalize">{key.replace(/_/g, " ")}</span><strong>{rate.toFixed(2)}%</strong></div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CurrencyConverterInline({ className }: { className?: string }) {
  const { rates, convert, lastUpdated, stale } = useExchangeRates();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("BRL");

  const numericAmount = parseFloat(amount) || 0;
  const result = useMemo(() => convert(numericAmount, from, to), [numericAmount, from, to, convert]);
  const swap = () => { setFrom(to); setTo(from); };

  const directRate = from !== "BRL" && to === "BRL" && rates[from]
    ? rates[from].bid
    : from === "BRL" && to !== "BRL" && rates[to]
      ? 1 / rates[to].bid
      : null;
  const selectedRate = from === "BRL" ? rates[to] : rates[from];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-xl font-bold h-12 tabular-nums" step="0.01" min="0" />
          <CurrencySelect value={from} onChange={setFrom} />
        </div>

        <button onClick={swap} className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors flex-shrink-0">
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex-1 space-y-1">
          <Input type="text" value={result.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: from === "PYG" || to === "PYG" ? 0 : 4 })} readOnly className="text-xl font-bold h-12 tabular-nums bg-muted/50" />
          <CurrencySelect value={to} onChange={setTo} />
        </div>
      </div>

      {directRate !== null && (
        <div className="text-xs text-center space-y-1">
          <p className="text-muted-foreground">1 {from} = {directRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {to}</p>
          {selectedRate && <p className={cn("font-medium", selectedRate.pctChange >= 0 ? "text-income" : "text-expense")}>{selectedRate.pctChange >= 0 ? "+" : ""}{selectedRate.pctChange.toFixed(2)}% no dia</p>}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>{stale ? "⚠️ Cotação pode estar desatualizada" : `Atualizado ${timeAgo(lastUpdated)}`}</span>
        <span>· {SOURCE_LABELS[selectedRate?.source ?? "awesome"]}</span>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ["exchange-rates"] })} className="p-1 rounded hover:bg-muted transition-colors" title="Atualizar cotações">
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      <OperationCosts amount={numericAmount} from={from} to={to} rates={rates} converted={result} />
      <ExchangeHistoryChart from={from} to={to} />

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Moeda</th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Compra</th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Venda</th>
              <th className="text-right py-2 px-3 text-muted-foreground font-medium">Var 24h</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(rates).map((r: ExchangeRate) => {
              const cur = CURRENCIES.find((c) => c.code === r.code);
              return (
                <tr key={r.code} className="border-t border-border/50">
                  <td className="py-2 px-3 font-medium text-foreground">{cur?.flag} {r.code}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.bid.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{r.ask.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                  <td className={cn("py-2 px-3 text-right font-medium tabular-nums", r.pctChange >= 0 ? "text-income" : "text-expense")}>{r.pctChange >= 0 ? "+" : ""}{r.pctChange.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CurrencyConverterPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-2 rounded-lg hover:bg-muted transition-colors" title="Conversor de moedas">
          <ArrowLeftRight className="h-5 w-5 text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(28rem,calc(100vw-2rem))] max-h-[85vh] overflow-y-auto p-4" align="end" sideOffset={8}>
        <h4 className="text-sm font-semibold text-foreground mb-3">Conversor de Moedas</h4>
        <CurrencyConverterInline />
      </PopoverContent>
    </Popover>
  );
}
