import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialSnapshot, AiTip } from "@/lib/aiTips";
import { generateFinancialTips, getCachedTips } from "@/lib/aiTips";

const tipConfig = {
  economia: { icon: "💰", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800" },
  alerta: { icon: "⚠️", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800" },
  conquista: { icon: "🏆", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-violet-200 dark:border-violet-800" },
};

interface Props {
  snapshot: FinancialSnapshot;
  userId: string;
}

export function AiTipsCard({ snapshot, userId }: Props) {
  const [tips, setTips] = useState<AiTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (skipCache = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateFinancialTips(snapshot, userId, skipCache);
      setTips(result);
    } catch (e: any) {
      setError(e.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check cache first synchronously
    const cached = getCachedTips(userId);
    if (cached) {
      setTips(cached);
      setLoading(false);
    } else {
      load();
    }
  }, [userId]);

  return (
    <Card className="fade-in">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-foreground">💡 Dicas personalizadas para você</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Powered by IA
            </span>
            <button
              onClick={() => load(true)}
              disabled={loading}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="Atualizar dicas"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-4 space-y-2">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Não foi possível carregar as dicas. Tente novamente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tips.map((tip, i) => {
              const cfg = tipConfig[tip.tipo] || tipConfig.economia;
              return (
                <div key={i} className={cn("rounded-xl border p-4", cfg.bg, cfg.border)}>
                  <span className="text-lg">{cfg.icon}</span>
                  <p className="text-sm font-semibold text-foreground mt-1">{tip.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.descricao}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
