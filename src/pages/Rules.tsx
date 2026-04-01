import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const matchTypeLabels: Record<string, string> = {
  contains:        "contém",
  starts_with:     "começa com",
  regex:           "regex",
  merchant_equals: "merchant =",
};

interface DbRule {
  id: string;
  user_id: string;
  priority: number | null;
  match_type: string;
  match_value: string;
  category_id: string | null;
  usage_count: number | null;
  created_at: string | null;
}

interface DbCategory {
  id: string;
  name: string;
  icon: string;
}

export default function Rules() {
  const { user } = useAuth();
  const [rules, setRules] = useState<DbRule[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [rulesRes, catsRes] = await Promise.all([
      supabase.from("rules").select("*").order("priority", { ascending: true }),
      supabase.from("categories").select("id, name, icon"),
    ]);
    setRules((rulesRes.data as DbRule[]) || []);
    setCategories((catsRes.data as DbCategory[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getCategory = (id: string | null) => {
    if (!id) return undefined;
    return categories.find(c => c.id === id);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("rules").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir regra"); return; }
    toast.success("Regra excluída");
    fetchData();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Regras</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aplicadas em ordem de prioridade antes da categorização por IA.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova regra
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="atlas-card p-10 text-center fade-in">
          <div className="text-4xl mb-4">⚙️</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Nenhuma regra criada</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Crie regras para categorizar automaticamente suas transações.
          </p>
        </div>
      ) : (
        <div className="atlas-card overflow-hidden fade-in">
          {rules.map((rule, i) => {
            const cat = getCategory(rule.category_id);
            return (
              <div key={rule.id}>
                {i > 0 && <div className="border-t border-border" />}
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <span className="h-6 w-6 rounded-full bg-muted text-xs font-bold text-muted-foreground flex items-center justify-center">
                      {rule.priority ?? i + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground">
                        {matchTypeLabels[rule.match_type] || rule.match_type}
                      </span>
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary font-mono">
                        "{rule.match_value}"
                      </span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                        {cat?.icon} {cat?.name || "Sem categoria"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Usada {rule.usage_count ?? 0}x
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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