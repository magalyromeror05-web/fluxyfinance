import { supabase } from "@/integrations/supabase/client";

const LAST_CHECK_KEY = "fluxy_last_notification_check";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function shouldRunNotificationChecks(): boolean {
  const last = localStorage.getItem(LAST_CHECK_KEY);
  if (!last) return true;
  return Date.now() - Number(last) > CHECK_INTERVAL_MS;
}

export function markNotificationCheckDone() {
  localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
}

async function notificationExists(userId: string, type: string, metaKey: string, metaValue: string, monthStr: string): Promise<boolean> {
  const startOfMonth = `${monthStr}-01T00:00:00Z`;
  const d = new Date(startOfMonth);
  const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", type)
    .gte("created_at", startOfMonth)
    .lte("created_at", endOfMonth)
    .contains("metadata", { [metaKey]: metaValue });

  return (count ?? 0) > 0;
}

export async function checkBudgetAlerts(userId: string) {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const [{ data: budgets }, { data: transactions }, { data: categories }] = await Promise.all([
    supabase.from("budgets").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").gte("posted_at", start).lte("posted_at", end),
    supabase.from("categories").select("*").eq("user_id", userId),
  ]);

  if (!budgets || !transactions || !categories) return;

  const catMap = new Map(categories.map((c) => [c.id, c]));

  for (const budget of budgets) {
    if (!budget.category_id) continue;
    const spent = transactions
      .filter((t) => t.category_id === budget.category_id && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const cat = catMap.get(budget.category_id);
    const catName = cat?.name ?? budget.name;

    if (pct >= 100) {
      const exists = await notificationExists(userId, "budget_alert", "category_id", budget.category_id, monthStr);
      if (!exists) {
        const over = spent - budget.amount;
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "budget_alert",
          title: `🔴 ${catName} estourou o orçamento`,
          message: `Você gastou R$ ${over.toFixed(2)} além do orçamento de R$ ${budget.amount.toFixed(2)} em ${catName}.`,
          action_url: "/orcamentos",
          metadata: { category_id: budget.category_id, pct: Math.round(pct) },
        });
      }
    } else if (pct >= 80) {
      const exists = await notificationExists(userId, "budget_alert", "category_id", budget.category_id, monthStr);
      if (!exists) {
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "budget_alert",
          title: `⚠️ ${catName} chegou a ${Math.round(pct)}% do orçamento`,
          message: `Você já gastou R$ ${spent.toFixed(2)} de R$ ${budget.amount.toFixed(2)} em ${catName}.`,
          action_url: "/orcamentos",
          metadata: { category_id: budget.category_id, pct: Math.round(pct) },
        });
      }
    }
  }
}

export async function checkConnectionExpiring(userId: string) {
  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "expiring");

  if (!connections?.length) return;

  for (const conn of connections) {
    const exists = await notificationExists(userId, "connection_expiring", "connection_id", conn.id, new Date().toISOString().slice(0, 7));
    if (!exists) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "connection_expiring",
        title: `🟡 Conexão com ${conn.provider} expirando`,
        message: `Sua conexão com ${conn.provider} expira em breve. Renove para manter seus dados sincronizados.`,
        action_url: "/conexoes",
        metadata: { connection_id: conn.id },
      });
    }
  }
}

export async function checkBillsDue(userId: string) {
  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const today = now.toISOString().slice(0, 10);

  const { data: installments } = await supabase
    .from("contract_installments")
    .select("*, contracts:contract_id(title)")
    .eq("status", "pending")
    .gte("due_date", today)
    .lte("due_date", sevenDays);

  if (!installments?.length) return;

  for (const inst of installments) {
    const exists = await notificationExists(userId, "bill_due", "installment_id", inst.id, now.toISOString().slice(0, 7));
    if (!exists) {
      const dueDate = new Date(inst.due_date);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const contractTitle = (inst as any).contracts?.title ?? "Contrato";
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "bill_due",
        title: `📅 Parcela de ${contractTitle} vence em ${diffDays} dia${diffDays !== 1 ? "s" : ""}`,
        message: `Parcela ${inst.number} de R$ ${Number(inst.amount).toFixed(2)} vence em ${new Date(inst.due_date).toLocaleDateString("pt-BR")}.`,
        action_url: "/contratos",
        metadata: { installment_id: inst.id, contract_id: inst.contract_id },
      });
    }
  }
}

export async function runAllNotificationChecks(userId: string) {
  if (!shouldRunNotificationChecks()) return;
  try {
    await Promise.all([
      checkBudgetAlerts(userId),
      checkConnectionExpiring(userId),
      checkBillsDue(userId),
    ]);
  } finally {
    markNotificationCheckDone();
  }
}
