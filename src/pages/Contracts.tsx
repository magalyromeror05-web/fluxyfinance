import { mockContracts, formatCurrency, CURRENCY_LABELS, type ContractStatus } from "@/data/mockData";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { CheckCircle2, Clock, AlertCircle, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const statusConfig: Record<ContractStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
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
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggle = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos de Empréstimo</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cada contrato exibido sempre na moeda original.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Upload className="h-4 w-4" />
          Novo contrato
        </button>
      </div>

      <div className="space-y-4 fade-in">
        {mockContracts.map(contract => {
          const { label, className, icon: StatusIcon } = statusConfig[contract.status];
          const isOpen = expanded.includes(contract.id);
          const paidCount = contract.schedule.filter(s => s.status === "paid").length;
          const totalInstallments = contract.installments;
          const progress = Math.round((paidCount / totalInstallments) * 100);

          return (
            <div key={contract.id} className="atlas-card overflow-hidden">
              {/* Header */}
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
                      {contract.lender} · {contract.interestRate}% a.{contract.rateType === "monthly" ? "m." : "a."} · {contract.installments}x
                    </p>
                    {contract.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5 italic">{contract.notes}</p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold tabular-nums text-foreground">
                      {formatCurrency(contract.principalAmount, contract.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">principal</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{paidCount} pagas</span>
                    <span>{progress}%</span>
                    <span>{totalInstallments - paidCount} restantes</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-income transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => toggle(contract.id)}
                  className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {isOpen ? "Ocultar parcelas" : "Ver agenda de parcelas"}
                </button>
              </div>

              {/* Installment schedule */}
              {isOpen && (
                <div className="border-t border-border bg-muted/20 px-5 py-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Agenda de parcelas</p>
                  <div className="space-y-2">
                    {contract.schedule.map(inst => {
                      const { icon: InstIcon, className: instClass } = installmentStatus[inst.status];
                      const dueDate = new Date(inst.dueDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                      return (
                        <div key={inst.number} className="flex items-center gap-3">
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
    </div>
  );
}
