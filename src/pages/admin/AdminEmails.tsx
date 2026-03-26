import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Mail, Send, Eye, Plus, Search, Download } from "lucide-react";
import { emailService } from "@/lib/emailService";

// ---------- types ----------
interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  body_text: string;
  body_html: string;
  variables: string[];
  active: boolean;
  last_edited_by: string | null;
  updated_at: string;
  created_at: string;
}

interface EmailLog {
  id: string;
  user_id: string | null;
  template_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  resend_id: string | null;
  error_message: string | null;
  sent_at: string;
}

interface Campaign {
  id: string;
  name: string;
  template_id: string | null;
  target: string;
  status: string;
  scheduled_at: string | null;
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  created_at: string;
}

// ---------- component ----------
export default function AdminEmails() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Emails</h1>
        <p className="text-sm text-muted-foreground">Gerencie templates, campanhas e logs de envio</p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="templates"><TemplatesTab /></TabsContent>
        <TabsContent value="campaigns"><CampaignsTab /></TabsContent>
        <TabsContent value="logs"><LogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ==================== TEMPLATES TAB ====================
function TemplatesTab() {
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testTemplate, setTestTemplate] = useState<EmailTemplate | null>(null);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as unknown as EmailTemplate[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (tpl: Partial<EmailTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({
          name: tpl.name,
          subject: tpl.subject,
          body_html: tpl.body_html,
          body_text: tpl.body_text,
          active: tpl.active,
          last_edited_by: user?.email ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tpl.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-email-templates"] });
      toast.success("Template salvo");
      setEditing(null);
    },
    onError: () => toast.error("Erro ao salvar template"),
  });

  const handleSendTest = async () => {
    if (!testEmail || !testTemplate) return;
    try {
      await emailService.sendCustom(
        testTemplate.type,
        testEmail,
        "Teste",
        null,
        { nome: "Teste", link_app: window.location.origin + "/dashboard", link_reset: "#", mes: "Março 2026", categoria: "Alimentação", percentual: "95", valor_gasto: "950,00", valor_orcado: "1.000,00", total_entradas: "5.000,00", total_saidas: "4.200,00", saldo: "800,00", diagnostico: "Mês equilibrado.", assunto: "Novidade", titulo: "Novidades do Fluxy", conteudo: "Conteúdo de teste.", texto_botao: "Acessar", link_botao: "#", link_orcamentos: "#", link_relatorio: "#" }
      );
      toast.success("Email de teste enviado para " + testEmail);
      setTestModalOpen(false);
      setTestEmail("");
    } catch {
      toast.error("Erro ao enviar email de teste");
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última edição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                  <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">{t.subject}</TableCell>
                  <TableCell>
                    <Badge variant={t.active ? "default" : "secondary"}>
                      {t.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setTestTemplate(t); setTestModalOpen(true); }}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar template: {editing?.name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Assunto</Label>
                  <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Variáveis disponíveis</Label>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(editing.variables ?? []).map((v: string) => (
                    <Badge key={v} variant="outline" className="cursor-pointer text-xs" onClick={() => {
                      const ta = document.getElementById("html-editor") as HTMLTextAreaElement | null;
                      if (ta) {
                        const start = ta.selectionStart;
                        const val = ta.value;
                        const newVal = val.slice(0, start) + `{{${v}}}` + val.slice(ta.selectionEnd);
                        setEditing({ ...editing, body_html: newVal });
                      }
                    }}>
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>HTML do email</Label>
                  <Textarea
                    id="html-editor"
                    className="min-h-[300px] font-mono text-xs"
                    value={editing.body_html}
                    onChange={(e) => setEditing({ ...editing, body_html: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Preview</Label>
                  <div className="border rounded-lg overflow-hidden h-[300px]">
                    <iframe
                      title="preview"
                      srcDoc={editing.body_html}
                      className="w-full h-full"
                      sandbox=""
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <Label>Template ativo</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={() => updateMutation.mutate(editing)} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar template"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Test email dialog */}
      <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar email de teste</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Template: <strong>{testTemplate?.name}</strong>
            </p>
            <div className="space-y-1.5">
              <Label>Email de destino</Label>
              <Input placeholder="email@exemplo.com" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} type="email" />
            </div>
            <Button className="w-full" onClick={handleSendTest}>
              <Send className="h-4 w-4 mr-2" /> Enviar teste
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== CAMPAIGNS TAB ====================
function CampaignsTab() {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", template_id: "", target: "all", scheduled_at: "" });
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const { data } = await supabase.from("email_templates").select("*").order("created_at");
      return (data ?? []) as unknown as EmailTemplate[];
    },
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["admin-email-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("email_campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Campaign[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("email_campaigns").insert({
        name: form.name,
        template_id: form.template_id || null,
        target: form.target,
        status: form.scheduled_at ? "scheduled" : "draft",
        scheduled_at: form.scheduled_at || null,
        created_by: user?.email ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-email-campaigns"] });
      toast.success("Campanha criada");
      setCreating(false);
      setForm({ name: "", template_id: "", target: "all", scheduled_at: "" });
    },
    onError: () => toast.error("Erro ao criar campanha"),
  });

  const sendCampaign = async (campaign: Campaign) => {
    if (!campaign.template_id) { toast.error("Campanha sem template"); return; }
    setSendingId(campaign.id);

    try {
      // Get template
      const { data: tpl } = await supabase.from("email_templates").select("*").eq("id", campaign.template_id).single();
      if (!tpl) throw new Error("Template não encontrado");

      // Get users based on target
      const { data: profiles } = await supabase.rpc("admin_get_all_profiles");
      if (!profiles?.length) { toast.error("Nenhum usuário encontrado"); return; }

      let filtered = profiles;
      if (campaign.target === "free_users") filtered = profiles.filter((p: any) => p.plan === "free");
      else if (campaign.target === "pro_users") filtered = profiles.filter((p: any) => p.plan === "pro" || p.plan === "pro_annual");
      else if (campaign.target === "inactive") {
        const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        filtered = profiles.filter((p: any) => !p.last_active_at || p.last_active_at < threshold);
      }

      // Update status to sending
      await supabase.from("email_campaigns").update({ status: "sending" }).eq("id", campaign.id);

      let sent = 0, failed = 0;
      for (const profile of filtered) {
        try {
          // We need the user email - use profile id to get from auth (via admin function)
          const email = (profile as any).email || `user-${profile.id}@fluxy.app`;
          await emailService.sendCustom(
            (tpl as any).type,
            email,
            profile.full_name || "Usuário",
            profile.id,
            { nome: profile.full_name || "Usuário", link_app: window.location.origin + "/dashboard" }
          );
          sent++;
        } catch {
          failed++;
        }
        // Update progress
        await supabase.from("email_campaigns").update({ sent_count: sent, failed_count: failed }).eq("id", campaign.id);
      }

      await supabase.from("email_campaigns").update({ status: "sent", sent_count: sent, failed_count: failed }).eq("id", campaign.id);
      toast.success(`Campanha enviada: ${sent} enviados, ${failed} falhas`);
      qc.invalidateQueries({ queryKey: ["admin-email-campaigns"] });
    } catch (err: any) {
      toast.error("Erro ao enviar campanha: " + err.message);
      await supabase.from("email_campaigns").update({ status: "draft" }).eq("id", campaign.id);
    } finally {
      setSendingId(null);
    }
  };

  const targetLabels: Record<string, string> = {
    all: "Todos",
    free_users: "Plano Free",
    pro_users: "Plano Pro",
    inactive: "Inativos (30d+)",
  };

  const statusBadge = (s: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline", scheduled: "secondary", sending: "default", sent: "default", cancelled: "destructive",
    };
    return <Badge variant={variants[s] ?? "outline"}>{s}</Badge>;
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-2" /> Nova campanha</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Destinatários</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enviados/Falhas</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const tpl = templates.find((t) => t.id === c.template_id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{tpl?.name ?? "—"}</TableCell>
                    <TableCell>{targetLabels[c.target] ?? c.target}</TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell className="text-sm">
                      <span className="text-green-600">{c.sent_count}</span> / <span className="text-red-500">{c.failed_count}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      {(c.status === "draft" || c.status === "scheduled") && (
                        <Button size="sm" disabled={sendingId === c.id} onClick={() => sendCampaign(c)}>
                          {sendingId === c.id ? "Enviando..." : "Enviar"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!campaigns.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma campanha criada ainda
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create campaign dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova campanha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome da campanha</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Lançamento Pro" />
            </div>
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecionar template" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Destinatários</Label>
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  <SelectItem value="free_users">Apenas plano Free</SelectItem>
                  <SelectItem value="pro_users">Apenas plano Pro</SelectItem>
                  <SelectItem value="inactive">Inativos (30+ dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Agendar para (opcional)</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
            </div>
            <Button className="w-full" onClick={() => createMutation.mutate()} disabled={!form.name || !form.template_id || createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar campanha"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==================== LOGS TAB ====================
function LogsTab() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-email-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as unknown as EmailLog[];
    },
  });

  const filtered = logs.filter((l) => {
    if (search && !l.recipient_email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && l.template_type !== filterType) return false;
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    return true;
  });

  const uniqueTypes = [...new Set(logs.map((l) => l.template_type))];

  const statusBadge = (s: string) => {
    if (s === "sent") return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">sent</Badge>;
    if (s === "failed") return <Badge variant="destructive">failed</Badge>;
    if (s === "bounced") return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">bounced</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  const exportCsv = () => {
    const header = "Data,Destinatário,Template,Status,Resend ID\n";
    const rows = filtered.map((l) =>
      `${new Date(l.sent_at).toLocaleString("pt-BR")},${l.recipient_email},${l.template_type},${l.status},${l.resend_id ?? ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "email-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {uniqueTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resend ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.sent_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm">{l.recipient_email}</TableCell>
                  <TableCell><Badge variant="outline">{l.template_type}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{l.subject}</TableCell>
                  <TableCell>{statusBadge(l.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{l.resend_id ?? "—"}</TableCell>
                </TableRow>
              ))}
              {!filtered.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isLoading ? "Carregando..." : "Nenhum email encontrado"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
