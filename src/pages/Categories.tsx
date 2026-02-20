import { mockCategories, mockTransactions, formatCurrency, type Currency } from "@/data/mockData";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL = "ALL" as const;
type Filter = Currency | typeof ALL;

const topLevel = mockCategories.filter(c => !c.parentId);
function getChildren(parentId: string) {
  return mockCategories.filter(c => c.parentId === parentId);
}
function getCategoryTotal(categoryId: string, currency?: Currency) {
  const childIds = [categoryId, ...mockCategories.filter(c => c.parentId === categoryId).map(c => c.id)];
  return mockTransactions
    .filter(t => childIds.includes(t.categoryId) && (currency ? t.currency === currency : true))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
}

export default function Categories() {
  const [filter, setFilter] = useState<Filter>(ALL);
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggle = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const currencies: Currency[] = ["BRL", "USD", "PYG"];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Árvore de categorias com drill-down por moeda.
        </p>
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

      <div className="atlas-card overflow-hidden fade-in">
        {topLevel.map((cat, i) => {
          const children = getChildren(cat.id);
          const isOpen = expanded.includes(cat.id);
          const hasChildren = children.length > 0;

          const totalForCurrencies = filter === ALL
            ? currencies.map(cur => ({ cur, val: getCategoryTotal(cat.id, cur) })).filter(x => x.val > 0)
            : [{ cur: filter as Currency, val: getCategoryTotal(cat.id, filter as Currency) }].filter(x => x.val > 0);

          return (
            <div key={cat.id}>
              {i > 0 && <div className="border-t border-border" />}
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
                onClick={() => hasChildren && toggle(cat.id)}
              >
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{cat.type}</p>
                </div>

                <div className="flex items-center gap-2">
                  {totalForCurrencies.map(({ cur, val }) => (
                    <div key={cur} className="text-right">
                      <p className="text-xs font-semibold tabular-nums text-foreground">
                        {formatCurrency(val, cur as Currency)}
                      </p>
                      <CurrencyBadge currency={cur as Currency} size="sm" />
                    </div>
                  ))}
                </div>

                {hasChildren && (
                  <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform flex-shrink-0", isOpen && "rotate-90")} />
                )}
              </button>

              {/* Children */}
              {isOpen && children.map(child => (
                <div key={child.id} className="border-t border-border bg-muted/20 flex items-center gap-3 px-4 py-3 pl-12">
                  <span className="text-base">{child.icon}</span>
                  <p className="text-sm text-foreground flex-1">{child.name}</p>
                  {(filter === ALL ? currencies : [filter as Currency]).map(cur => {
                    const val = getCategoryTotal(child.id, cur);
                    if (!val) return null;
                    return (
                      <div key={cur} className="text-right">
                        <p className="text-xs font-semibold tabular-nums text-foreground">
                          {formatCurrency(val, cur)}
                        </p>
                        <CurrencyBadge currency={cur} size="sm" />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
