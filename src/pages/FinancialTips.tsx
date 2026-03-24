import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { financialTips, CATEGORY_META, type FinancialTip } from "@/data/financialTips";
import { cn } from "@/lib/utils";

const ALL_CATEGORIES: Array<FinancialTip['category'] | 'todas'> = [
  'todas', 'moradia', 'cartao', 'alimentacao', 'transporte', 'poupanca', 'investimento', 'emergencia', 'geral',
];

export default function FinancialTips() {
  const [filter, setFilter] = useState<FinancialTip['category'] | 'todas'>('todas');

  const filtered = filter === 'todas' ? financialTips : financialTips.filter(t => t.category === filter);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dicas Financeiras</h1>
        <p className="text-sm text-muted-foreground mt-1">Conhecimento que transforma sua relação com o dinheiro</p>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {ALL_CATEGORIES.map(cat => {
          const meta = cat === 'todas' ? { label: 'Todas', icon: '📚' } : CATEGORY_META[cat];
          return (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border",
                filter === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {meta.icon} {meta.label}
            </button>
          );
        })}
      </div>

      {/* Tips grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(tip => {
          const meta = CATEGORY_META[tip.category];
          return (
            <Card key={tip.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{meta.icon}</span>
                    <h3 className="text-sm font-bold text-foreground leading-tight">{tip.title}</h3>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{tip.content}</p>

                {tip.benchmark && (
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-1">
                    <p className="text-xs font-semibold text-foreground">
                      📊 {tip.benchmark.label}: <span className="text-primary">{tip.benchmark.value}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground">Fonte: {tip.benchmark.source}</p>
                  </div>
                )}

                <Badge variant="secondary" className="text-[10px]">
                  {meta.icon} {meta.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
