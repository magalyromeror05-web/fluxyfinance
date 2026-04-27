import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConnections } from "@/hooks/useSupabaseData";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  RefreshCw,
  Landmark,
  Unplug,
  Loader2,
  Clock,
  WifiOff,
  Search,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
import { useTranslation } from "react-i18next";
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BANKS = [
  { id: "nubank", name: "Nubank", emoji: "💜" },
  { id: "itau", name: "Itaú", emoji: "🟠" },
  { id: "bradesco", name: "Bradesco", emoji: "🔴" },
  { id: "santander", name: "Santander", emoji: "🔴" },
  { id: "bb", name: "Banco do Brasil", emoji: "🟡" },
  { id: "caixa", name: "Caixa", emoji: "🔵" },
  { id: "inter", name: "Inter", emoji: "🟠" },
  { id: "c6", name: "C6 Bank", emoji: "⚫" },
  { id: "btg", name: "BTG Pactual", emoji: "🔵" },
  { id: "xp", name: "XP", emoji: "⚫" },
] as const;

const statusConfig = {
  connected: {
    icon: CheckCircle2,
    label: "Conectado",
    className: "text-income",
    bgClass: "bg-income/10 border-income/20",
  },
  expiring: {
    icon: AlertTriangle,
    label: "Expirando",
    className: "text-amber-600",
    bgClass: "bg-amber-50 border-amber-200",
  },
  disconnected: {
    icon: XCircle,
    label: "Desconectado",
    className: "text-expense",
    bgClass: "bg-expense/10 border-expense/20",
  },
  pending: {
    icon: Clock,
    label: "Aguardando aprovação",
    className: "text-amber-600",
    bgClass: "bg-amber-50 border-amber-200",
  },
} as const;

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Nunca";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export default function Connections() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: connections = [], isLoading } = useConnections();
  const queryClient = useQueryClient();

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<(typeof BANKS)[number] | null>(null);
  const [cpf, setCpf] = useState("");
  const [agency, setAgency] = useState("");
  const [connecting, setConnecting] = useState(false);

  const filteredBanks = useMemo(
    () => BANKS.filter((b) => b.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  );

  const resetModal = useCallback(() => {
    setModalOpen(false);
    setStep(1);
    setSearch("");
    setSelectedBank(null);
    setCpf("");
    setAgency("");
    setConnecting(false);
  }, []);

  const handleSync = useCallback(
    async (connectionId: string, itemId: string) => {
      if (!user) return;
      if (!itemId || itemId === "pending") {
        toast.info("Aguardando aprovação do banco. A sincronização acontecerá automaticamente.");
        return;
      }
      setSyncingId(connectionId);
      try {
        const { data, error } = await supabase.functions.invoke("pluggy-sync", {
          body: { itemId, userId: user.id, connectionId },
        });
        if (error) throw error;
        toast.success(
          `Sincronização concluída: ${data?.syncedAccounts ?? 0} conta(s) e ${data?.syncedTransactions ?? 0} transação(ões).`,
        );
        queryClient.invalidateQueries({ queryKey: ["connections"] });
        queryClient.invalidateQueries({ queryKey: ["accounts"] });
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      } catch (err: any) {
        toast.error("Erro na sincronização: " + (err.message || "Tente novamente"));
      } finally {
        setSyncingId(null);
      }
    },
    [user, queryClient],
  );

  const handleConfirmConnect = useCallback(async () => {
    if (!user || !selectedBank) return;
    setConnecting(true);
    try {
      const { data: conn, error: connErr } = await supabase
        .from("connections")
        .insert({
          user_id: user.id,
          provider: selectedBank.name,
          provider_type: "open_finance",
          country: "BR",
          status: "connected",
          item_id: "pending",
          accounts_count: 0,
          logo: selectedBank.emoji,
        })
        .select("id")
        .single();

      if (connErr) throw connErr;

      toast.success("Banco registrado! A sincronização acontecerá quando a conexão Open Finance for aprovada.");
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      resetModal();
    } catch (err: any) {
      toast.error("Erro ao conectar: " + (err.message || "Tente novamente"));
      setConnecting(false);
    }
  }, [user, selectedBank, queryClient, resetModal]);

  const handleDisconnect = async () => {
    if (!disconnectId) return;
    await supabase.from("connections").update({ status: "disconnected" }).eq("id", disconnectId);
    queryClient.invalidateQueries({ queryKey: ["connections"] });
    toast.success("Banco desconectado");
    setDisconnectId(null);
  };

  const activeConnections = connections.filter((c) => c.status !== "disconnected");
  const disconnectedConnections = connections.filter((c) => c.status === "disconnected");

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("pages.connections")}</h1>
          <p className="text-sm text-muted-foreground mt-1">Conecte seus bancos e sincronize automaticamente</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("common.add")} {t("pages.connections")}
        </Button>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
        🔒 <strong>Conexão segura</strong> via Open Finance regulado pelo Banco Central do Brasil
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        💡 A conexão via Open Finance pode levar até 24h para ser aprovada pelo seu banco.
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : connections.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Landmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Nenhum banco conectado ainda</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Conecte seu banco para importar transações automaticamente via Open Finance
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Conectar primeiro banco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeConnections.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Conexões ativas ({activeConnections.length})
              </h2>
              <div className="space-y-3 mb-8">
                {activeConnections.map((conn) => {
                  const isPending = !conn.item_id || conn.item_id === "pending";
                  const statusKey = isPending ? "pending" : (conn.status as keyof typeof statusConfig) || "connected";
                  const { icon: StatusIcon, label, className, bgClass } = statusConfig[statusKey];
                  const isSyncing = syncingId === conn.id;

                  return (
                    <Card key={conn.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                          {conn.logo || conn.provider?.charAt(0) || "B"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-foreground text-sm">{conn.provider}</p>
                            <span className="text-sm">🇧🇷</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Open Finance · {conn.accounts_count || 0} conta(s)
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Último sync: {timeAgo(conn.last_sync_at)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <div className={cn("flex items-center gap-1.5 rounded-full border px-2.5 py-1", bgClass)}>
                            <StatusIcon className={cn("h-3 w-3", className)} />
                            <span className={cn("text-xs font-medium", className)}>{label}</span>
                          </div>
                          {!isPending && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                disabled={isSyncing}
                                onClick={() => conn.item_id && handleSync(conn.id, conn.item_id)}
                              >
                                {isSyncing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                                Sincronizar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-destructive hover:text-destructive"
                                onClick={() => setDisconnectId(conn.id)}
                              >
                                <Unplug className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {disconnectedConnections.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Desconectados
              </h2>
              <div className="space-y-3 mb-8 opacity-60">
                {disconnectedConnections.map((conn) => (
                  <Card key={conn.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg flex-shrink-0">
                        {conn.logo || conn.provider?.charAt(0) || "B"}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{conn.provider}</p>
                        <p className="text-xs text-muted-foreground">Desconectado</p>
                      </div>
                      <WifiOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-6 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Privacidade & Segurança</p>
        <p>
          Seus dados são armazenados com criptografia. O consentimento é gerenciado diretamente com sua instituição
          financeira via Open Finance.
        </p>
      </div>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) resetModal();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("h-2 flex-1 rounded-full transition-colors", step >= 1 ? "bg-primary" : "bg-muted")} />
            <div className={cn("h-2 flex-1 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-muted")} />
          </div>

          {step === 1 ? (
            <>
              <DialogHeader>
                <DialogTitle>Conectar via Open Finance</DialogTitle>
              </DialogHeader>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar banco..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 max-h-72 overflow-y-auto pr-1">
                {filteredBanks.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => {
                      setSelectedBank(bank);
                      setStep(2);
                    }}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-2xl">{bank.emoji}</span>
                    <span className="text-sm font-medium text-foreground">{bank.name}</span>
                  </button>
                ))}
                {filteredBanks.length === 0 && (
                  <p className="col-span-2 text-center text-sm text-muted-foreground py-8">Nenhum banco encontrado</p>
                )}
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <DialogTitle>Conectar {selectedBank?.name}</DialogTitle>
                </div>
              </DialogHeader>
              <p className="text-sm text-muted-foreground mt-1">
                Preencha os dados abaixo para autenticar com segurança.
              </p>
              <div className="space-y-3 mt-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">CPF ou CNPJ</label>
                  <Input placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">
                    Agência <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <Input placeholder="0001" value={agency} onChange={(e) => setAgency(e.target.value)} />
                </div>
              </div>
              <Button className="w-full mt-4" disabled={!cpf.trim() || connecting} onClick={handleConfirmConnect}>
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {connecting ? "Conectando..." : "Conectar com segurança"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                🔒 Conexão regulada pelo Banco Central do Brasil
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!disconnectId} onOpenChange={() => setDisconnectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar banco?</AlertDialogTitle>
            <AlertDialogDescription>
              A conexão será marcada como desconectada. Suas transações já importadas serão mantidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect}>Desconectar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
