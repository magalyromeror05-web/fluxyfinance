import { useState, useEffect, useCallback } from "react";
import {
  mockCategories,
  formatCurrency,
  type Currency,
  type CategorySource,
} from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { CategorySourceBadge } from "@/components/CategorySourceBadge";
import { ManualTransactionForm } from "@/components/ManualTransactionForm";
import { cn } from "@/lib/utils";
import { Pencil, Plus, Wifi, HandMetal, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ALL = "ALL" as const;
type Filter = Currency | typeof ALL;

interface DbTransaction {
  id: string;
  user_id: string;
  account_id: string | null;
  posted_at: string;
  amount: number;
  currency: string;
  description_raw: string | null;
  merchant: string;
  category_id: string | null;
  category_source: string;
  institution_name: string | null;
  source: string;
  created_at: string;
}

function getCategory(id: string | null) {
  if (!id) return undefined;
  return mockCategories.find((c) => c.id === id);
}

function groupByCurrency(txs: DbTransaction[]) {
  const map: Record<Currency, DbTransaction[]> = { BRL: [], USD: [], PYG: [] };
  txs.forEach((tx) => {
    const cur = tx.currency as Currency;
    if (map[cur]) map[cur].push(tx);
  });
  return map;
}

export default function Transactions() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>(ALL);
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("posted_at", { ascending: false });

    if (!error && data) {
      setTransactions(data as unknown as DbTransaction[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filtered = tab === "all"
    ? transactions
    : transactions.filter((tx) => tx.source === tab);

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime()
  );

  const renderTx = (tx: DbTransaction) => {
    const cat = getCategory(tx.category_id);
    const date = new Date(tx.posted_at);
    const dateLabel = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
    const cur = tx.currency as Currency;

    return (
      <div
        key={tx.id}
        className="flex items-center gap-3 md:gap-4 px-3 md:px-4 py-3 rounded-xl hover:bg-muted/40 transition-colors"
      >
        {/* Date */}
        <div className="w-10 md:w-12 text-center flex-shrink-0">
          <p className="text-xs font-semibold text-muted-foreground">
            {dateLabel}
          </p>
        </div>

        {/* Icon */}
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-sm flex-shrink-0">
          {cat?.icon ?? "💳"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {tx.merchant}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {cat && (
              <span className="text-xs text-muted-foreground">{cat.name}</span>
            )}
            {cat && <span className="text-muted-foreground text-xs">·</span>}
            <CategorySourceBadge
              source={tx.category_source as CategorySource}
            />
            {tx.institution_name && (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">
                  {tx.institution_name}
                </span>
              </>
            )}
            {tx.source === "manual" && (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground italic">
                  manual
                </span>
              </>
            )}
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
          {formatCurrency(Math.abs(tx.amount), cur)}
        </span>

        {/* Actions */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Corrigir categoria"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Criar regra"
          >
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
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movimentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registre manualmente ou conecte via Open Finance.
          </p>
        </div>
        <ManualTransactionForm onCreated={fetchTransactions} />
      </div>

      {/* Source tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="manual" className="gap-1.5">
            <HandMetal className="h-3.5 w-3.5" /> Manual
          </TabsTrigger>
          <TabsTrigger value="open_finance" className="gap-1.5">
            <Wifi className="h-3.5 w-3.5" /> Open Finance
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Currency filter chips */}
      <div className="flex gap-2 mb-6">
        {([ALL, "BRL", "USD", "PYG"] as const).map((f) => (
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground text-sm">
            Nenhuma movimentação encontrada.
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            Use o botão "Manual" para registrar ou conecte via Open Finance.
          </p>
        </div>
      ) : (
        <div className="space-y-6 fade-in">
          {(filter === ALL ? currencies : [filter as Currency]).map((cur) => {
            const txs = grouped[cur];
            if (!txs.length) return null;
            return (
              <div key={cur} className="atlas-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                  <CurrencyBadge currency={cur} size="sm" />
                  <span className="text-xs text-muted-foreground font-medium">
                    {txs.length} movimentações
                  </span>
                </div>
                <div>{txs.map(renderTx)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
