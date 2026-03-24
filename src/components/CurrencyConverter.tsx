import { useState, useMemo } from "react";
import { useExchangeRates, type ExchangeRate } from "@/hooks/useExchangeRates";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const CURRENCIES = [
  { code: "BRL", flag: "🇧🇷", name: "Real" },
  { code: "USD", flag: "🇺🇸", name: "Dólar" },
  { code: "EUR", flag: "🇪🇺", name: "Euro" },
  { code: "GBP", flag: "🇬🇧", name: "Libra" },
  { code: "PYG", flag: "🇵🇾", name: "Guarani" },
  { code: "ARS", flag: "🇦🇷", name: "Peso AR" },
  { code: "CLP", flag: "🇨🇱", name: "Peso CL" },
  { code: "COP", flag: "🇨🇴", name: "Peso CO" },
  { code: "UYU", flag: "🇺🇾", name: "Peso UY" },
];

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

export function CurrencyConverterInline({ className }: { className?: string }) {
  const { rates, convert, lastUpdated, stale } = useExchangeRates();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("BRL");

  const result = useMemo(() => {
    const val = parseFloat(amount) || 0;
    return convert(val, from, to);
  }, [amount, from, to, convert]);

  const swap = () => { setFrom(to); setTo(from); };

  const directRate = from !== "BRL" && to === "BRL" && rates[from]
    ? rates[from].bid
    : from === "BRL" && to !== "BRL" && rates[to]
      ? 1 / rates[to].bid
      : null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-xl font-bold h-12 tabular-nums"
            step="0.01"
            min="0"
          />
          <CurrencySelect value={from} onChange={setFrom} />
        </div>

        <button
          onClick={swap}
          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors flex-shrink-0"
        >
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex-1 space-y-1">
          <Input
            type="text"
            value={result.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: from === "PYG" || to === "PYG" ? 0 : 4 })}
            readOnly
            className="text-xl font-bold h-12 tabular-nums bg-muted/50"
          />
          <CurrencySelect value={to} onChange={setTo} />
        </div>
      </div>

      {directRate !== null && (
        <p className="text-xs text-muted-foreground text-center">
          1 {from} = {directRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {to}
        </p>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>{stale ? "⚠️ Cotação pode estar desatualizada" : `Atualizado ${timeAgo(lastUpdated)}`}</span>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["exchange-rates"] })}
          className="p-1 rounded hover:bg-muted transition-colors"
          title="Atualizar cotações"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {/* Quick rates table */}
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
                  <td className={cn("py-2 px-3 text-right font-medium tabular-nums", r.pctChange >= 0 ? "text-income" : "text-expense")}>
                    {r.pctChange >= 0 ? "+" : ""}{r.pctChange.toFixed(2)}%
                  </td>
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
      <PopoverContent className="w-96 p-4" align="end" sideOffset={8}>
        <h4 className="text-sm font-semibold text-foreground mb-3">Conversor de Moedas</h4>
        <CurrencyConverterInline />
      </PopoverContent>
    </Popover>
  );
}
