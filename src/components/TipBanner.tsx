import { useState, useMemo } from "react";
import { X, Lightbulb, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { financialTips, CATEGORY_META, type FinancialTip } from "@/data/financialTips";
import { cn } from "@/lib/utils";

interface TipBannerProps {
  page: 'orcamentos' | 'investimentos' | 'contas' | 'saude-financeira';
  userContext?: {
    hasEmergencyFund?: boolean;
    hasCreditAccount?: boolean;
    overBudgetCategories?: string[];
    healthScore?: number;
  };
}

const PAGE_CATEGORIES: Record<TipBannerProps['page'], FinancialTip['category'][]> = {
  orcamentos: ['moradia', 'alimentacao', 'transporte', 'poupanca', 'geral'],
  investimentos: ['investimento', 'emergencia'],
  contas: ['cartao', 'geral'],
  'saude-financeira': ['poupanca', 'emergencia', 'geral'],
};

const STORAGE_KEY = 'fluxy_dismissed_tips';

function getDismissed(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch { return new Set(); }
}

function dismiss(id: string) {
  const s = getDismissed();
  s.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
}

export function TipBanner({ page, userContext }: TipBannerProps) {
  const [dismissed, setDismissed] = useState(getDismissed);
  const [expanded, setExpanded] = useState(false);

  const tip = useMemo(() => {
    const cats = PAGE_CATEGORIES[page];
    const candidates = financialTips.filter(t => cats.includes(t.category) && !dismissed.has(t.id));

    // Prioritize by trigger condition matching
    if (page === 'investimentos' && userContext && !userContext.hasEmergencyFund) {
      const em = candidates.find(t => t.triggerCondition === 'sem_fundo_emergencia');
      if (em) return em;
    }
    if (page === 'contas' && userContext?.hasCreditAccount) {
      const cc = candidates.find(t => t.triggerCondition === 'tem_conta_cartao');
      if (cc) return cc;
    }
    if (page === 'orcamentos' && userContext?.overBudgetCategories?.length) {
      const cat = userContext.overBudgetCategories[0].toLowerCase();
      const match = candidates.find(t => {
        if (cat.includes('morad') && t.triggerCondition === 'moradia_acima_30pct') return true;
        if (cat.includes('aliment') && t.triggerCondition === 'alimentacao_acima_20pct') return true;
        if (cat.includes('transport') && t.triggerCondition === 'transporte_acima_10pct') return true;
        return false;
      });
      if (match) return match;
    }

    return candidates[0] || null;
  }, [page, userContext, dismissed]);

  if (!tip) return null;

  const meta = CATEGORY_META[tip.category];

  const handleDismiss = () => {
    dismiss(tip.id);
    setDismissed(new Set([...dismissed, tip.id]));
  };

  return (
    <div className="rounded-lg border border-primary/15 bg-primary/5 p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{meta.icon} {tip.title}</p>
            <button onClick={handleDismiss} className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors flex-shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {expanded ? (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.content}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tip.content}</p>
          )}

          {tip.benchmark && expanded && (
            <div className="mt-2 rounded bg-card border p-2">
              <p className="text-[11px] font-medium text-foreground">📊 {tip.benchmark.value}</p>
              <p className="text-[10px] text-muted-foreground">Fonte: {tip.benchmark.source}</p>
            </div>
          )}

          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary font-medium hover:underline">
              {expanded ? 'Resumir' : 'Saiba mais'}
            </button>
            <Link to="/dicas" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Ver todas as dicas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
