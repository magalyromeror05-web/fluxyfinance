import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, CURRENCY_LABELS, type ContractStatus } from "@/types/database";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { CheckCircle2, Clock, AlertCircle, Upload, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  active:  { label: "Ativo", className: "text-income bg-income/10", icon: Clock },
  paid:    { label: "Quitado", className: "text-muted-foreground bg-muted", icon: CheckCircle2 },
  overdue: { label: "Em atraso", className: "text-expense bg-expense/10", icon: AlertCircle },
};

const installmentStatus: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  paid:    { icon: CheckCircle2, className: "text-income" },
  pending: { icon: Clock, className: "text-muted-foreground" },
  overdue: { icon: AlertCircle, className: "text-expense" },
};

export default function Contracts() {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggle = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["contracts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: installments = [] } = useQuery({
    queryKey: ["contract_installments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_installments")
        .select("*")
        .order("number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos de Empréstimo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada contrato exibido sempre na moeda original.
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo contrato
        </Button>
      </div>

      {contracts.length === 0 ? (
        <div className="atlas-card p-10 text-center fade-in">
          <div className="text-4xl mb-4">📄</div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Nenhum contrato cadastrado</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Adicione seus contratos de empréstimo para acompanhar parcelas e progresso.
          </p>
        </div>
      ) : (
        <div className="space-y-4 fade-in">
          {contracts.map(contract => {
            const sc = statusConfig[contract.status || "active"] || statusConfig.active;
            const { label, className, icon: StatusIcon } = sc;
            const isOpen = expanded.includes(contract.id);
            const contractInstallments = installments.filter(i => i.contract_id === contract.id);
            const paidCount = contractInstallments.filter(s => s.status === "paid").length;
            const totalInstallments = contract.installments || 1;
            const progress = Math.round((paidCount / totalInstallments) * 100);

            return (
              <div key={contract.id} className="atlas-card overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-foreground">{contract.title}</p>
                        <CurrencyBadge currency={contract.currency} size="sm" />
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", className)}>
                          <StatusIcon className="h-3 w-3" />
                          {label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {contract.lender || "—"} · {contract.interest_rate ?? 0}% a.{contract.rate_type === "monthly" ? "m." : "a."} · {totalInstallments}x
                      </p>
                      {contract.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{contract.notes}</p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold tabular-nums text-foreground">
                        {formatCurrency(contract.principal_amount, contract.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">principal</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{paidCount} pagas</span>
                      <span>{progress}%</span>
                      <span>{totalInstallments - paidCount} restantes</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-income transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {contractInstallments.length > 0 && (
                    <button
                      onClick={() => toggle(contract.id)}
                      className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {isOpen ? "Ocultar parcelas" : "Ver agenda de parcelas"}
                    </button>
                  )}
                </div>

                {isOpen && contractInstallments.length > 0 && (
                  <div className="border-t border-border bg-muted/20 px-5 py-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Agenda de parcelas</p>
                    <div className="space-y-2">
                      {contractInstallments.map(inst => {
                        const is = installmentStatus[inst.status || "pending"] || installmentStatus.pending;
                        const { icon: InstIcon, className: instClass } = is;
                        const dueDate = new Date(inst.due_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                        return (
                          <div key={inst.id} className="flex items-center gap-3">
                            <InstIcon className={cn("h-3.5 w-3.5 flex-shrink-0", instClass)} />
                            <span className="text-xs text-muted-foreground w-14 flex-shrink-0">Parcela {inst.number}</span>
                            <span className="text-xs text-muted-foreground flex-1">{dueDate}</span>
                            <span className="text-xs font-semibold tabular-nums text-foreground">
                              {formatCurrency(inst.amount, contract.currency)}
                            </span>
                            <span className={cn("text-[10px] font-medium capitalize", instClass)}>
                              {inst.status === "paid" ? "pago" : inst.status === "pending" ? "pendente" : "em atraso"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}