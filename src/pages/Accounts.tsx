import { useState } from "react";
import { useAccounts } from "@/hooks/useSupabaseData";
import { formatCurrency, CURRENCY_LABELS } from "@/types/database";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { cn } from "@/lib/utils";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Building2, Plus, PenLine } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "ALL" as const;
type Filter = string | typeof ALL;

const statusConfig: Record<string, { icon: typeof CheckCircle2; label: string; className: string }> = {
  connected: { icon: CheckCircle2, label: "Conectado", className: "text-income" },
  expiring: { icon: AlertTriangle, label: "Expirando", className: "text-amber-500" },
  disconnected: { icon: XCircle, label: "Desconectado", className: "text-expense" },
  manual: { icon: PenLine, label: "Manual", className: "text-muted-foreground" },
};

const typeLabels: Record<string, string> = {
  checking: "Conta Corrente",
  savings: "Poupança",
  credit: "Crédito",
  investment: "Investimento",
  wallet: "Carteira Digital",
};

const accountTypes = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "credit", label: "Crédito" },
  { value: "investment", label: "Investimento" },
  { value: "wallet", label: "Carteira Digital" },
];

const currencyOptions = ["BRL", "USD", "PYG", "EUR", "GBP", "ARS", "CLP", "COP", "UYU"];

export default function Accounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading } = useAccounts();
  const [filter, setFilter] = useState<Filter>(ALL);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    institution_name: "",
    account_name: "",
    type: "checking",
    currency: "BRL",
    balance: "",
  });

  const filtered = filter === ALL ? accounts : accounts.filter((a) => a.currency === filter);

  // Get unique currencies from user accounts
  const userCurrencies = [...new Set(accounts.map((a) => a.currency))];

  const totals: Record<string, number> = {};
  for (const cur of userCurrencies) {
    totals[cur] = accounts.filter((a) => a.currency === cur).reduce((s, a) => s + a.balance, 0);
  }

  const handleCreate = async () => {
    if (!user) return;
    if (!form.institution_name.trim() || !form.account_name.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("accounts").insert({
      user_id: user.id,
      institution_name: form.institution_name.trim(),
      account_name: form.account_name.trim(),
      type: form.type,
      currency: form.currency,
      balance: Math.abs(parseFloat(form.balance) || 0),
      connection_id: null,
      status: "manual",
    });
    setSaving(false);

    if (error) {
      toast.error("Erro ao criar conta: " + error.message);
      return;
    }

    toast.success("Conta criada com sucesso!");
    setForm({ institution_name: "", account_name: "", type: "checking", currency: "BRL", balance: "" });
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  };

  /** Derive display status: manual if no connection_id, otherwise use DB status */
  const getDisplayStatus = (account: (typeof accounts)[0]) => {
    if (!account.connection_id) return "manual";
    return account.status;
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <div className="space-y-3 mt-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {accounts.length} contas em {new Set(accounts.map((a) => a.institution_name)).size} instituições.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Adicionar conta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Conta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Instituição</Label>
                <Input
                  placeholder="Ex: Nubank, Itaú, Wise"
                  value={form.institution_name}
                  onChange={(e) => setForm((f) => ({ ...f, institution_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Nome da conta</Label>
                <Input
                  placeholder="Ex: Conta Corrente, Poupança"
                  value={form.account_name}
                  onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {accountTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Moeda</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Saldo inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.balance}
                  onChange={(e) => setForm((f) => ({ ...f, balance: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full">
                {saving ? "Salvando..." : "Criar conta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <div className="atlas-card p-10 text-center fade-in">
          <div className="text-4xl mb-4">🏦</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Nenhuma conta cadastrada</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Adicione suas contas bancárias ou carteiras digitais para começar.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
            {userCurrencies.map((cur) => (
              <div key={cur} className="atlas-card p-4">
                <CurrencyBadge currency={cur as any} size="sm" />
                <p className="text-xl font-bold tabular-nums mt-2 text-foreground">
                  {formatCurrency(totals[cur], cur)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {accounts.filter((a) => a.currency === cur).length} conta(s)
                </p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[ALL, ...userCurrencies].map((f) => (
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

          {/* Accounts list */}
          <div className="space-y-3 fade-in">
            {filtered.map((account) => {
              const displayStatus = getDisplayStatus(account);
              const sc = statusConfig[displayStatus] || statusConfig.manual;
              const { icon: StatusIcon, label, className } = sc;
              const isManual = !account.connection_id;
              const syncDate = account.last_sync_at ? new Date(account.last_sync_at) : null;
              const syncLabel = syncDate
                ? syncDate.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })
                : null;

              return (
                <div key={account.id} className="atlas-card p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground text-sm">{account.institution_name}</p>
                      <CurrencyBadge currency={account.currency as any} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {account.account_name} · {typeLabels[account.type] || account.type}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold tabular-nums text-foreground">
                      {formatCurrency(account.balance, account.currency)}
                    </p>
                    {!isManual && syncLabel && (
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{syncLabel}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <StatusIcon className={cn("h-3.5 w-3.5", className)} />
                    <span className={cn("text-[10px] font-medium", className)}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
