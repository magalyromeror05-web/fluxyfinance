import { useState, useEffect, useCallback } from "react";
import {
  formatCurrency,
  type Currency,
  type CategorySource,
  type DbTransaction,
} from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { CategorySourceBadge } from "@/components/CategorySourceBadge";
import { ManualTransactionForm } from "@/components/ManualTransactionForm";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/EmptyState";

export default function Transactions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("posted_at", { ascending: false });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("pages.transactions")}</h1>
          <p className="text-sm text-muted-foreground">Histórico completo de movimentações.</p>
        </div>
        <ManualTransactionForm onCreated={fetchTransactions} />
      </div>

      {transactions.length === 0 ? (
        <EmptyState icon={PlusCircle} title="Nenhuma transação ainda" subtitle="Adicione sua primeira movimentação ou conecte um banco para acompanhar seu histórico." actionLabel="Adicionar movimentação" onAction={() => window.dispatchEvent(new CustomEvent("fluxy:quick-add", { detail: { type: "expense" } }))} />
      ) : (
        <div className="atlas-card overflow-hidden">
          <div className="divide-y divide-border">
            {transactions.map((tx, index) => (
              <div key={tx.id} style={{ animationDelay: `${index * 50}ms` }} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-all duration-200 hover:shadow-card animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    tx.amount > 0 ? "bg-income/10" : "bg-expense/10"
                  )}>
                    {tx.amount > 0 ? (
                      <ArrowDownLeft className="h-5 w-5 text-income" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5 text-expense" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{tx.merchant}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.posted_at).toLocaleDateString("pt-BR")}
                      </span>
                      <CategorySourceBadge source={tx.category_source as CategorySource} />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-bold tabular-nums",
                    tx.amount > 0 ? "text-income" : "text-foreground"
                  )}>
                    {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <CurrencyBadge currency={tx.currency as Currency} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
