import {
  mockAccounts,
  mockTransactions,
  mockConnections,
  getBalanceByCurrency,
  getMonthlyByCurrency,
  formatCurrency,
  CURRENCY_LABELS,
  type Currency,
} from "@/data/mockData";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { CategorySourceBadge } from "@/components/CategorySourceBadge";
import { TrendingUp, TrendingDown, RefreshCw, Bell, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const balances = getBalanceByCurrency(mockAccounts);
const currencies: Currency[] = ["BRL", "USD", "PYG"];

const events: { currency: Currency; text: string; icon: string }[] = [
  { currency: "BRL", text: "Salário detectado em Nubank", icon: "💼" },
  { currency: "BRL", text: "Aluguel debitado (Regra aplicada)", icon: "🏠" },
  { currency: "USD", text: "Pagamento freelance recebido", icon: "🎯" },
  { currency: "USD", text: "Assinatura recorrente: Notion", icon: "📺" },
  { currency: "PYG", text: "Salário creditado em Banco Continental", icon: "💼" },
];

function CurrencySection({ currency }: { currency: Currency }) {
  const { income, expenses } = getMonthlyByCurrency(mockTransactions, currency);
  const balance = balances[currency];
  const { flag, name } = CURRENCY_LABELS[currency];
  const currencyEvents = events.filter(e => e.currency === currency);
  const recentTxs = mockTransactions
    .filter(t => t.currency === currency)
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
    .slice(0, 3);

  const colorVar = currency === "BRL" ? "var(--brl)" : currency === "USD" ? "var(--usd)" : "var(--pyg)";

  return (
    <section className="fade-in">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-1 w-8 rounded-full"
          style={{ backgroundColor: `hsl(${colorVar})` }}
        />
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{flag} {name}</span>
        <CurrencyBadge currency={currency} size="sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Balance */}
        <div className="atlas-card p-5 col-span-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">Saldo total</p>
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
            {formatCurrency(balance, currency)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {mockAccounts.filter(a => a.currency === currency).length} conta(s)
          </p>
        </div>

        {/* Income */}
        <div className="atlas-card p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">Entradas (mês)</p>
            <TrendingUp className="h-3.5 w-3.5 text-income" />
          </div>
          <p className="text-xl font-bold tabular-nums text-income">
            +{formatCurrency(income, currency)}
          </p>
        </div>

        {/* Expenses */}
        <div className="atlas-card p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-muted-foreground">Saídas (mês)</p>
            <TrendingDown className="h-3.5 w-3.5 text-expense" />
          </div>
          <p className="text-xl font-bold tabular-nums text-expense">
            -{formatCurrency(expenses, currency)}
          </p>
        </div>
      </div>

      {/* Events + Recent Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Events card */}
        <div className="atlas-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Eventos</p>
          </div>
          {currencyEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem eventos este mês.</p>
          ) : (
            <ul className="space-y-2">
              {currencyEvents.map((ev, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-base">{ev.icon}</span>
                  <span className="text-foreground">{ev.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent transactions */}
        <div className="atlas-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Últimas movimentações</p>
          {recentTxs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem movimentações.</p>
          ) : (
            <ul className="space-y-2.5">
              {recentTxs.map(tx => (
                <li key={tx.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.merchant}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CategorySourceBadge source={tx.categorySource} />
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold tabular-nums flex-shrink-0",
                      tx.amount > 0 ? "text-income" : "text-expense"
                    )}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {formatCurrency(Math.abs(tx.amount), tx.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const hasExpiring = mockConnections.some(c => c.status === "expiring");

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão por moeda para evitar confusão. Cada uma no seu lugar.
        </p>
      </div>

      {/* Alert: expiring connection */}
      {hasExpiring && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 fade-in">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Conexão expirando em breve</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Salt Edge (PY) expira em 5 dias. Reconecte para manter o sync.
            </p>
          </div>
        </div>
      )}

      {/* Last sync */}
      <div className="flex items-center gap-2 mb-6 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        <span>Última sincronização: hoje às 09:00 · Tudo certo — isso é só organização.</span>
      </div>

      {/* Currency sections */}
      <div className="space-y-10">
        {currencies.map(currency => (
          <CurrencySection key={currency} currency={currency} />
        ))}
      </div>
    </div>
  );
}
