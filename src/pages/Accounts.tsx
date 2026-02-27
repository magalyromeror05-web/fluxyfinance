import { useState } from "react";
import { mockAccounts, formatCurrency, type Currency } from "@/data/mockData";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { cn } from "@/lib/utils";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Building2 } from "lucide-react";

const ALL = "ALL" as const;
type Filter = Currency | typeof ALL;

const statusConfig = {
  connected:    { icon: CheckCircle2, label: "Conectado", className: "text-income" },
  expiring:     { icon: AlertTriangle, label: "Expirando", className: "text-amber-500" },
  disconnected: { icon: XCircle, label: "Desconectado", className: "text-expense" },
};

const typeLabels: Record<string, string> = {
  checking:   "Conta Corrente",
  savings:    "Poupança",
  credit:     "Crédito",
  investment: "Investimento",
  wallet:     "Carteira Digital",
};

export default function Accounts() {
  const [filter, setFilter] = useState<Filter>(ALL);

  const filtered = filter === ALL ? mockAccounts : mockAccounts.filter(a => a.currency === filter);

  const totals: Record<Currency, number> = {
    BRL: mockAccounts.filter(a => a.currency === "BRL").reduce((s, a) => s + a.balance, 0),
    USD: mockAccounts.filter(a => a.currency === "USD").reduce((s, a) => s + a.balance, 0),
    PYG: mockAccounts.filter(a => a.currency === "PYG").reduce((s, a) => s + a.balance, 0),
  };

  const currencies: Currency[] = ["BRL", "USD", "PYG"];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Contas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mockAccounts.length} contas em {new Set(mockAccounts.map(a => a.institutionName)).size} instituições.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        {currencies.map(cur => (
          <div key={cur} className="atlas-card p-4">
            <CurrencyBadge currency={cur} size="sm" />
            <p className="text-xl font-bold tabular-nums mt-2 text-foreground">
              {formatCurrency(totals[cur], cur)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mockAccounts.filter(a => a.currency === cur).length} conta(s)
            </p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {([ALL, "BRL", "USD", "PYG"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border",
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            )}
          >
            {f === ALL ? "Todas" : f}
          </button>
        ))}
      </div>

      {/* Accounts list */}
      <div className="space-y-3 fade-in">
        {filtered.map(account => {
          const { icon: StatusIcon, label, className } = statusConfig[account.status];
          const syncDate = new Date(account.lastSyncAt);
          const syncLabel = syncDate.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });

          return (
            <div key={account.id} className="atlas-card p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground text-sm">{account.institutionName}</p>
                  <CurrencyBadge currency={account.currency} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">{account.accountName} · {typeLabels[account.type]}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold tabular-nums text-foreground">
                  {formatCurrency(account.balance, account.currency)}
                </p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{syncLabel}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <StatusIcon className={cn("h-3.5 w-3.5", className)} />
                <span className={cn("text-[10px] font-medium", className)}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
