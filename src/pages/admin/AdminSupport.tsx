import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, MessageSquare, Mail } from "lucide-react";
import { toast } from "sonner";

type Ticket = {
  id: string;
  user_id: string;
  user_email: string | null;
  message: string;
  page_context: string | null;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  respondido: "Respondido",
  fechado: "Fechado",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  aberto: "default",
  respondido: "secondary",
  fechado: "outline",
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("todos");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Não foi possível carregar tickets");
    } else {
      setTickets((data ?? []) as Ticket[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    const updates: any = { status };
    if (status === "respondido") updates.responded_at = new Date().toISOString();
    const { error } = await supabase
      .from("support_tickets")
      .update(updates)
      .eq("id", id);
    if (error) {
      toast.error("Falha ao atualizar status");
    } else {
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      toast.success("Status atualizado");
    }
    setUpdatingId(null);
  };

  const filtered = filter === "todos" ? tickets : tickets.filter((t) => t.status === filter);

  const counts = {
    todos: tickets.length,
    aberto: tickets.filter((t) => t.status === "aberto").length,
    respondido: tickets.filter((t) => t.status === "respondido").length,
    fechado: tickets.filter((t) => t.status === "fechado").length,
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tickets de Suporte</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mensagens enviadas pelos usuários através do widget de suporte.
        </p>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="todos">Todos ({counts.todos})</TabsTrigger>
          <TabsTrigger value="aberto">Abertos ({counts.aberto})</TabsTrigger>
          <TabsTrigger value="respondido">Respondidos ({counts.respondido})</TabsTrigger>
          <TabsTrigger value="fechado">Fechados ({counts.fechado})</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum ticket nesta categoria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <Card key={t.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{t.user_email ?? "Sem email"}</span>
                      <Badge variant={STATUS_VARIANT[t.status] ?? "default"}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(t.created_at).toLocaleString("pt-BR")}
                      {t.page_context && (
                        <>
                          {" · "}
                          <code className="bg-muted px-1.5 py-0.5 rounded">
                            {t.page_context}
                          </code>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {t.status !== "respondido" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(t.id, "respondido")}
                        disabled={updatingId === t.id}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Marcar respondido
                      </Button>
                    )}
                    {t.status !== "fechado" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(t.id, "fechado")}
                        disabled={updatingId === t.id}
                      >
                        Fechar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {t.message}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
