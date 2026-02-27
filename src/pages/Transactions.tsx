import { useState } from "react";
import {
  mockTransactions,
  mockCategories,
  formatCurrency,
  type Currency,
  type Transaction,
} from "@/data/mockData";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { CategorySourceBadge } from "@/components/CategorySourceBadge";
import { cn } from "@/lib/utils";
import { Pencil, Plus } from "lucide-react";

const ALL = "ALL" as const;
type Filter = Currency | typeof ALL;

function getCategory(id: string) {
  return mockCategories.find(c => c.id === id);
}

function groupByCurrency(txs: Transaction[]) {
  const map: Record<Currency, Transaction[]> = { BRL: [], USD: [], PYG: [] };
  txs.forEach(tx => map[tx.currency].push(tx));
  return map;
}

export default function Transactions() {
  const [filter, setFilter] = useState<Filter>(ALL);

  const sorted = [...mockTransactions].sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );

  const renderTx = (tx: Transaction) => {
    const cat = getCategory(tx.categoryId);
    const date = new Date(tx.postedAt);
    const dateLabel = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

    return (
      <div
        key={tx.id}
        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted/40 transition-colors"
      >
        {/* Date */}
        <div className="w-12 text-center flex-shrink-0">
          <p className="text-xs font-semibold text-muted-foreground">{dateLabel}</p>
        </div>

        {/* Icon */}
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm flex-shrink-0">
          {cat?.icon ?? "💳"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{tx.merchant}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{cat?.name}</span>
            <span className="text-muted-foreground text-xs">·</span>
            <CategorySourceBadge source={tx.categorySource} />
            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs text-muted-foreground">{tx.institutionName}</span>
          </div>
        </div>

        {/* Amount */}
        <span
          className={cn(
            "font-semibold tabular-nums text-sm flex-shrink-0",
            tx.amount > 0 ? "text-income" : "text-expense"
          )}
        >
          {tx.amount > 0 ? "+" : ""}
          {formatCurrency(Math.abs(tx.amount), tx.currency)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Corrigir categoria">
            <Pencil className="h-3 w-3" />
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Criar regra">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  };

  const grouped = groupByCurrency(sorted);
  const currencies: Currency[] = ["BRL", "USD", "PYG"];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Movimentos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mockTransactions.length} movimentações · Separadas por moeda para clareza.
        </p>
      </div>

      {/* Filter chips */}
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

      <div className="space-y-6 fade-in">
        {(filter === ALL ? currencies : [filter as Currency]).map(cur => {
          const txs = grouped[cur];
          if (!txs.length) return null;
          return (
            <div key={cur} className="atlas-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <CurrencyBadge currency={cur} size="sm" />
                <span className="text-xs text-muted-foreground font-medium">{txs.length} movimentações</span>
              </div>
              <div>{txs.map(renderTx)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
