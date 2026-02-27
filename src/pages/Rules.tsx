import { mockRules, mockCategories } from "@/data/mockData";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const matchTypeLabels: Record<string, string> = {
  contains:        "contém",
  starts_with:     "começa com",
  regex:           "regex",
  merchant_equals: "merchant =",
};

function getCategory(id: string) {
  return mockCategories.find(c => c.id === id);
}

export default function Rules() {
  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Regras</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aplicadas em ordem de prioridade antes da categorização por IA.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Nova regra
        </button>
      </div>

      <div className="atlas-card overflow-hidden fade-in">
        {mockRules.map((rule, i) => {
          const cat = getCategory(rule.categoryId);
          return (
            <div key={rule.id}>
              {i > 0 && <div className="border-t border-border" />}
              <div className="flex items-center gap-3 px-4 py-4">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span className="h-6 w-6 rounded-full bg-muted text-xs font-bold text-muted-foreground flex items-center justify-center">
                    {rule.priority}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                      {matchTypeLabels[rule.matchType]}
                    </span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary font-mono">
                      "{rule.matchValue}"
                    </span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                      {cat?.icon} {cat?.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Usada {rule.usageCount}x
                  </p>
                </div>

                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-expense hover:bg-expense/10 transition-colors flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Como funciona a categorização</p>
        <ol className="list-decimal list-inside space-y-1">
          <li><strong>Banco</strong> — categoria fornecida pela instituição (quando disponível)</li>
          <li><strong>Regras</strong> — suas regras personalizadas, em ordem de prioridade</li>
          <li><strong>IA</strong> — categorização automática para o restante</li>
          <li><strong>Manual</strong> — correção feita por você</li>
        </ol>
      </div>
    </div>
  );
}
