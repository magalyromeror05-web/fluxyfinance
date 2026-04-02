import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useConnections } from "@/hooks/useSupabaseData";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CheckCircle2, AlertTriangle, XCircle, Plus, RefreshCw,
  Landmark, Unplug, Loader2, Clock, Wifi, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

declare global {
  interface Window {
    PluggyConnect: new (opts: {
      connectToken: string;
      onSuccess: (data: { item: { id: string } }) => void;
      onError: (err: { message: string }) => void;
      onClose: () => void;
    }) => { init: () => void };
  }
}

const statusConfig = {
  connected: { icon: CheckCircle2, label: "Conectado", className: "text-income", bgClass: "bg-income/10 border-income/20" },
  expiring: { icon: AlertTriangle, label: "Expirando", className: "text-amber-600", bgClass: "bg-amber-50 border-amber-200" },
  disconnected: { icon: XCircle, label: "Desconectado", className: "text-expense", bgClass: "bg-expense/10 border-expense/20" },
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
  const { user } = useAuth();
  const { data: connections = [], isLoading } = useConnections();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [disconnectId, setDisconnectId] = useState<string | null>(null);

  const handleSync = useCallback(async (connectionId: string, itemId: string) => {
    if (!user) return;
    setSyncingId(connectionId);
    try {
      const { data, error } = await supabase.functions.invoke("pluggy-sync", {
        body: { itemId, userId: user.id, connectionId },
      });
      if (error) throw error;

      toast.success(
        `Sincronização concluída: ${data?.syncedAccounts ?? 0} conta(s) e ${data?.syncedTransactions ?? 0} transação(ões).`
      );
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (err: any) {
      toast.error("Erro na sincronização: " + (err.message || "Tente novamente"));
    } finally {
      setSyncingId(null);
    }
  }, [user, queryClient]);

  const handleConnectBank = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Get Pluggy token
      const { data, error } = await supabase.functions.invoke("pluggy-auth");
      if (error || !data) {
        toast.error("Erro ao obter token da Pluggy");
        setLoading(false);
        return;
      }
      const connectToken = data?.connectToken;
      if (!connectToken) {
        toast.error("Token de conexão não recebido");
        setLoading(false);
        return;
      }

      // 2. Load Pluggy script dynamically
      await new Promise<void>((resolve, reject) => {
        if ((window as any).PluggyConnect) { resolve(); return; }
        const script = document.createElement("script");
        script.src = "https://cdn.pluggy.ai/pluggy-connect/v2.1.2/pluggy-connect.js";
        script.crossOrigin = "anonymous";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Falha ao carregar widget de conexão"));
        document.head.appendChild(script);
      });

      // 3. Open widget
      const pluggyConnect = new (window as any).PluggyConnect({
        connectToken,
        onSuccess: async ({ item }: any) => {
          try {
            const { data: conn, error: connErr } = await supabase
              .from("connections")
              .insert({
                user_id: user.id,
                provider: "Open Finance",
                provider_type: "open_finance",
                country: "BR",
                status: "connected",
                external_connection_id: item.id,
              })
              .select("id")
              .single();

            if (connErr) throw connErr;

            toast.success("Banco conectado! Sincronizando transações...");
            queryClient.invalidateQueries({ queryKey: ["connections"] });

            if (conn) {
              await handleSync(conn.id, item.id);
            }
          } catch (err: any) {
            toast.error("Erro ao salvar conexão: " + err.message);
          }
          setLoading(false);
        },
        onError: (err: any) => {
          toast.error("Erro ao conectar: " + err.message);
          setLoading(false);
        },
        onClose: () => {
          setLoading(false);
        },
      });

      pluggyConnect.init();
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente"));
      setLoading(false);
    }
  }, [user, queryClient, handleSync]);

  const handleDisconnect = async () => {
    if (!disconnectId) return;
    await supabase
      .from("connections")
      .update({ status: "disconnected" })
      .eq("id", disconnectId);
    queryClient.invalidateQueries({ queryKey: ["connections"] });
    toast.success("Banco desconectado");
    setDisconnectId(null);
  };

  const activeConnections = connections.filter((c) => c.status !== "disconnected");
  const disconnectedConnections = connections.filter((c) => c.status === "disconnected");

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conexões</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte seus bancos e sincronize automaticamente
          </p>
        </div>
        <Button onClick={handleConnectBank} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Conectar banco
        </Button>
      </div>

      {/* Security banner */}
      <div className="mb-6 rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
        🔒 <strong>Conexão segura</strong> via Open Finance regulado pelo Banco Central
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : connections.length === 0 ? (
        /* Empty state */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Landmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Nenhum banco conectado ainda
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Conecte seu banco para importar transações automaticamente via Open Finance
            </p>
            <Button onClick={handleConnectBank} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Conectar primeiro banco
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active connections */}
          {activeConnections.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Conexões ativas ({activeConnections.length})
              </h2>
              <div className="space-y-3 mb-8">
                {activeConnections.map((conn) => {
                  const status = (conn.status as keyof typeof statusConfig) || "connected";
                  const { icon: StatusIcon, label, className, bgClass } = statusConfig[status];
                  const isSyncing = syncingId === conn.id;

                  return (
                    <Card key={conn.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                          {conn.provider?.charAt(0) || "B"}
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

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={isSyncing}
                              onClick={() =>
                                conn.external_connection_id &&
                                handleSync(conn.id, conn.external_connection_id)
                              }
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
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {/* Disconnected */}
          {disconnectedConnections.length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Desconectados
              </h2>
              <div className="space-y-3 mb-8 opacity-60">
                {disconnectedConnections.map((conn) => (
                  <Card key={conn.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground flex-shrink-0">
                        {conn.provider?.charAt(0) || "B"}
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

      {/* Privacy footer */}
      <div className="mt-6 rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">Privacidade & Segurança</p>
        <p>
          Seus dados são armazenados com criptografia. O consentimento é gerenciado
          diretamente com sua instituição financeira via Open Finance.
        </p>
      </div>

      {/* Disconnect dialog */}
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
