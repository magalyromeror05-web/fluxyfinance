import { mockConnections, type ConnectionStatus } from "@/data/mockData";
import { CheckCircle2, AlertTriangle, XCircle, Plus, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<ConnectionStatus, { icon: typeof CheckCircle2; label: string; className: string; bgClass: string }> = {
  connected:    { icon: CheckCircle2, label: "Conectado", className: "text-income", bgClass: "bg-income/10 border-income/20" },
  expiring:     { icon: AlertTriangle, label: "Expirando", className: "text-amber-600", bgClass: "bg-amber-50 border-amber-200" },
  disconnected: { icon: XCircle, label: "Desconectado", className: "text-expense", bgClass: "bg-expense/10 border-expense/20" },
};

const providerTypeLabel: Record<string, string> = {
  open_finance: "Open Finance",
  wise:         "Wise Platform API",
  aggregator:   "Agregador Global",
  manual:       "Manual / Importação",
};

const countryFlag: Record<string, string> = {
  BR: "🇧🇷",
  US: "🇺🇸",
  PY: "🇵🇾",
};

const availableProviders = [
  { name: "Pluggy (Open Finance BR)", country: "BR", type: "open_finance", logo: "🏦" },
  { name: "Wise", country: "US", type: "wise", logo: "💸" },
  { name: "Salt Edge", country: "PY", type: "aggregator", logo: "🏛️" },
  { name: "Importação Manual (CSV/OFX)", country: "PY", type: "manual", logo: "📄" },
];

export default function Connections() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Conexões & Integrações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as fontes de dados das suas contas.
        </p>
      </div>

      {/* Active connections */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Conexões ativas</h2>
      <div className="space-y-3 mb-8 fade-in">
        {mockConnections.map(conn => {
          const { icon: StatusIcon, label, className, bgClass } = statusConfig[conn.status];
          const expiresDate = new Date(conn.consentExpiresAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

          return (
            <div key={conn.id} className="atlas-card p-4 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xl flex-shrink-0">
                {conn.logo}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-foreground text-sm">{conn.provider}</p>
                  <span className="text-sm">{countryFlag[conn.country]}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {providerTypeLabel[conn.providerType]} · {conn.accountsCount} conta(s) sincronizada(s)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consentimento expira em: {expiresDate}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1", bgClass)}>
                  <StatusIcon className={cn("h-3 w-3", className)} />
                  <span className={cn("text-xs font-medium", className)}>{label}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                    <RefreshCw className="h-3 w-3" />
                    Sincronizar
                  </button>
                  {conn.status !== "connected" && (
                    <button className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors font-medium">
                      Reconectar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Available providers */}
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Adicionar conexão</h2>
      <div className="grid grid-cols-2 gap-3 fade-in">
        {availableProviders.map(provider => (
          <button
            key={provider.name}
            className="atlas-card p-4 text-left hover:border-primary/40 hover:shadow-elevated transition-all group"
          >
            <div className="flex items-start justify-between">
              <span className="text-2xl">{provider.logo}</span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>{countryFlag[provider.country]}</span>
              </div>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {provider.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {providerTypeLabel[provider.type]}
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-accent font-medium">
              <Plus className="h-3 w-3" />
              Conectar
            </div>
          </button>
        ))}
      </div>

      {/* Info footer */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Privacidade & Segurança</p>
        <p>Seus dados são armazenados com criptografia. O consentimento é gerenciado diretamente com sua instituição financeira via Open Finance.</p>
      </div>
    </div>
  );
}
