import { supabase } from "@/integrations/supabase/client";

export interface FinancialSnapshot {
  totalIncomeBRL: number;
  totalExpensesBRL: number;
  topCategories: { name: string; amount: number; pct: number }[];
  budgetAlerts: { category: string; spent: number; limit: number }[];
  savingsRate: number;
  currency: string;
}

export interface AiTip {
  titulo: string;
  descricao: string;
  tipo: "economia" | "alerta" | "conquista";
}

const CACHE_HOURS = 24;

function cacheKey(userId: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `fluxy_ai_tips_${userId}_${date}`;
}

export function getCachedTips(userId: string): AiTip[] | null {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const { tips, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_HOURS * 3600 * 1000) return null;
    return tips;
  } catch {
    return null;
  }
}

function cacheTips(userId: string, tips: AiTip[]) {
  localStorage.setItem(cacheKey(userId), JSON.stringify({ tips, ts: Date.now() }));
}

export async function generateFinancialTips(
  snapshot: FinancialSnapshot,
  userId: string,
  skipCache = false
): Promise<AiTip[]> {
  if (!skipCache) {
    const cached = getCachedTips(userId);
    if (cached) return cached;
  }

  const { data, error } = await supabase.functions.invoke("ai-tips", {
    body: { snapshot },
  });

  if (error) throw new Error(error.message || "Failed to generate tips");
  if (data?.error) throw new Error(data.error);

  const tips: AiTip[] = (data.tips || []).slice(0, 3);
  cacheTips(userId, tips);
  return tips;
}
