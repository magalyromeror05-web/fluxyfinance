import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { format, subDays } from "date-fns";

const PAGE_SIZE = 20;

const periods = [
  { label: "Hoje", days: 0 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
];

export default function AdminLogs() {
  const [periodDays, setPeriodDays] = useState(7);
  const [searchMsg, setSearchMsg] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchPage, setSearchPage] = useState("");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const startDate = periodDays === 0
    ? new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
    : subDays(new Date(), periodDays).toISOString();

  const { data: logs } = useQuery({
    queryKey: ["admin-logs", startDate],
    queryFn: async () => {
      const { data } = await supabase
        .from("error_logs")
        .select("*")
        .gte("created_at", startDate)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    let list = logs ?? [];
    if (searchMsg.trim()) {
      const q = searchMsg.toLowerCase();
      list = list.filter((l: any) => l.error_message?.toLowerCase().includes(q));
    }
    if (searchUser.trim()) {
      const q = searchUser.toLowerCase();
      list = list.filter((l: any) => l.user_id?.toLowerCase().includes(q));
    }
    if (searchPage.trim()) {
      const q = searchPage.toLowerCase();
      list = list.filter((l: any) => l.page?.toLowerCase().includes(q));
    }
    return list;
  }, [logs, searchMsg, searchUser, searchPage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportCSV = () => {
    const header = "Data,Usuário,Página,Severidade,Mensagem\n";
    const rows = filtered.map((l: any) =>
      `"${format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss")}","${l.user_id ?? ""}","${l.page ?? ""}","${l.severity}","${(l.error_message ?? "").replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fluxy-error-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const severityBadge = (s: string) => {
    switch (s) {
      case "critical": return <Badge variant="destructive">🔴 Crítico</Badge>;
      case "warning": return <Badge variant="secondary" className="text-amber-700">🟡 Aviso</Badge>;
      default: return <Badge variant="outline">⚪ Info</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logs de erro</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} registros</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {periods.map(p => (
          <Button key={p.days} size="sm" variant={periodDays === p.days ? "default" : "outline"} onClick={() => { setPeriodDays(p.days); setPage(0); }}>
            {p.label}
          </Button>
        ))}
        <div className="relative flex-1 min-w-[160px] max-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Mensagem..." value={searchMsg} onChange={e => { setSearchMsg(e.target.value); setPage(0); }} className="pl-9 text-xs h-8" />
        </div>
        <Input placeholder="Página/rota..." value={searchPage} onChange={e => { setSearchPage(e.target.value); setPage(0); }} className="text-xs h-8 w-36" />
        <Input placeholder="User ID..." value={searchUser} onChange={e => { setSearchUser(e.target.value); setPage(0); }} className="text-xs h-8 w-36" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Data/hora</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Página</th>
                <th className="px-4 py-3 font-medium">Severidade</th>
                <th className="px-4 py-3 font-medium">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((l: any) => (
                <tr key={l.id} className="border-b hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setSelectedLog(l)}>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{format(new Date(l.created_at), "dd/MM HH:mm:ss")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.user_id?.slice(0, 8) ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.page ?? "—"}</td>
                  <td className="px-4 py-3">{severityBadge(l.severity)}</td>
                  <td className="px-4 py-3 text-foreground truncate max-w-[300px]">{l.error_message}</td>
                </tr>
              ))}
              {!paginated.length && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nenhum log encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Página {page + 1} de {totalPages}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Detail modal */}
      {selectedLog && (
        <Dialog open onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do erro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss")}</span>
                {severityBadge(selectedLog.severity)}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Mensagem</p>
                <p className="text-foreground">{selectedLog.error_message}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-1">Página</p>
                <p className="text-foreground">{selectedLog.page ?? "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase mb-1">User ID</p>
                <p className="text-foreground font-mono">{selectedLog.user_id ?? "—"}</p>
              </div>
              {selectedLog.error_stack && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Stack trace</p>
                  <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-[10px] font-mono whitespace-pre-wrap">{selectedLog.error_stack}</pre>
                </div>
              )}
              {selectedLog.metadata && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Metadata</p>
                  <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-[10px] font-mono whitespace-pre-wrap">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
