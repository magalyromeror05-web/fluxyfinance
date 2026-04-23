import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────
type CategoryKey =
  | "Alimentação"
  | "Transporte"
  | "Moradia"
  | "Saúde"
  | "Educação"
  | "Lazer"
  | "Compras"
  | "Salário"
  | "Transferência"
  | "Outros"
  | "Não identificado";

interface Bank {
  id: string;
  name: string;
  color: string;
}

interface Tx {
  id: string;
  bankId: string;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  amount: number; // negative = expense, positive = income
  category: CategoryKey;
  autoCategorized: boolean;
}

const CATEGORIES: CategoryKey[] = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Compras",
  "Salário",
  "Transferência",
  "Outros",
];

const BANK_COLORS = [
  "#8A05BE", // Nubank
  "#EC7000", // Itaú
  "#CC092F", // Bradesco
  "#EC0000", // Santander
  "#FFEF38", // BB
  "#005CA9", // Caixa
  "#FF7A00", // Inter
  "#000000", // C6
  "#101820", // BTG
  "#FFCB05", // XP
];

// ────────────────────────────────────────────────────────────────────
// Auto-categorization rules
// ────────────────────────────────────────────────────────────────────
const KEYWORD_RULES: Array<{ keys: string[]; cat: CategoryKey }> = [
  {
    keys: ["IFOOD", "RAPPI", "UBER EATS", "MCDONALDS", "BURGER", "PIZZA", "RESTAURANTE", "PADARIA", "MERCADO", "SUPERMERCADO", "CARREFOUR", "PAO DE", "ASSAI", "ATACADAO"],
    cat: "Alimentação",
  },
  {
    keys: ["UBER", "99 POP", "99POP", "CABIFY", "POSTO", "SHELL", "IPIRANGA", "BR MANIA", "GASOLINA", "METRO", "BUSAO"],
    cat: "Transporte",
  },
  {
    keys: ["ALUGUEL", "CONDOMINIO", "ENERGIA", "LUZ", "AGUA", "GAS", "ENEL", "CEMIG", "SABESP", "COPASA", "INTERNET", "VIVO FIBRA", "CLARO NET"],
    cat: "Moradia",
  },
  {
    keys: ["FARMACIA", "DROGARIA", "DROGASIL", "PACHECO", "RAIA", "HOSPITAL", "CLINICA", "MEDICO", "UNIMED", "AMIL", "PLANO DE SAUDE"],
    cat: "Saúde",
  },
  {
    keys: ["FACULDADE", "UNIVERSIDADE", "ESCOLA", "CURSO", "UDEMY", "ALURA", "COURSERA", "MENSALIDADE"],
    cat: "Educação",
  },
  {
    keys: ["NETFLIX", "SPOTIFY", "DISNEY", "PRIME VIDEO", "HBO", "GLOBOPLAY", "YOUTUBE", "STEAM", "PLAYSTATION", "XBOX", "CINEMA", "INGRESSO"],
    cat: "Lazer",
  },
  {
    keys: ["AMAZON", "MERCADO LIVRE", "MERCADOLIVRE", "MAGAZINE", "MAGALU", "AMERICANAS", "SHOPEE", "ALIEXPRESS", "RENNER", "C&A", "ZARA", "RIACHUELO"],
    cat: "Compras",
  },
  {
    keys: ["SALARIO", "SALÁRIO", "PAGAMENTO SALARIO", "FOLHA", "HOLERITE", "PROVENTO"],
    cat: "Salário",
  },
  {
    keys: ["PIX", "TED", "DOC", "TRANSFERENCIA", "TRANSFERÊNCIA"],
    cat: "Transferência",
  },
];

function autoCategorize(merchant: string): { cat: CategoryKey; auto: boolean } {
  const upper = merchant.toUpperCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keys.some((k) => upper.includes(k))) {
      return { cat: rule.cat, auto: true };
    }
  }
  return { cat: "Não identificado", auto: false };
}

// ────────────────────────────────────────────────────────────────────
// CSV / OFX parsing
// ────────────────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  // Handles quotes & commas
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines) {
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQ = !inQ;
      } else if ((c === "," || c === ";") && !inQ) {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    cells.push(cur.trim());
    rows.push(cells);
  }
  return rows;
}

function detectCols(header: string[]): { date: number; desc: number; amount: number } {
  const norm = header.map((h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  const findIdx = (keys: string[]) =>
    norm.findIndex((h) => keys.some((k) => h.includes(k)));
  return {
    date: findIdx(["data", "date"]),
    desc: findIdx(["descric", "descript", "historico", "memo", "merchant", "estabelec"]),
    amount: findIdx(["valor", "amount", "value"]),
  };
}

function parseDate(raw: string): string {
  const s = raw.trim().replace(/"/g, "");
  // try dd/mm/yyyy
  const br = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (br) {
    const [, d, m, y] = br;
    const yyyy = y.length === 2 ? `20${y}` : y;
    return `${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // try yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return new Date().toISOString().slice(0, 10);
}

function parseAmount(raw: string): number {
  let s = raw.trim().replace(/"/g, "").replace(/\s/g, "");
  // Remove currency symbols
  s = s.replace(/R\$|\$|€|£/gi, "");
  // BR format: 1.234,56  →  1234.56
  if (/,\d{1,2}$/.test(s)) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseCSVTransactions(text: string, bankId: string): Tx[] {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const cols = detectCols(rows[0]);
  if (cols.date < 0 || cols.desc < 0 || cols.amount < 0) {
    toast.error("Não foi possível detectar colunas (data, descrição, valor)");
    return [];
  }
  const txs: Tx[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[cols.date] || !r[cols.amount]) continue;
    const merchant = (r[cols.desc] || "Sem descrição").trim();
    const { cat, auto } = autoCategorize(merchant);
    txs.push({
      id: `${bankId}-${i}-${Date.now()}`,
      bankId,
      date: parseDate(r[cols.date]),
      merchant,
      amount: parseAmount(r[cols.amount]),
      category: cat,
      autoCategorized: auto,
    });
  }
  return txs;
}

function parseOFXTransactions(text: string, bankId: string): Tx[] {
  const txs: Tx[] = [];
  const blocks = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
  blocks.forEach((b, i) => {
    const date = (b.match(/<DTPOSTED>([\d]+)/i) || [])[1] || "";
    const amount = (b.match(/<TRNAMT>([-\d.,]+)/i) || [])[1] || "0";
    const memo = (b.match(/<MEMO>([^<\n\r]+)/i) || [])[1] || "";
    const name = (b.match(/<NAME>([^<\n\r]+)/i) || [])[1] || memo || "Sem descrição";
    const iso =
      date.length >= 8
        ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`
        : new Date().toISOString().slice(0, 10);
    const merchant = (name || memo).trim();
    const { cat, auto } = autoCategorize(merchant);
    txs.push({
      id: `${bankId}-ofx-${i}-${Date.now()}`,
      bankId,
      date: iso,
      merchant,
      amount: parseAmount(amount),
      category: cat,
      autoCategorized: auto,
    });
  });
  return txs;
}

// ────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────
export default function Extratos() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [showAddBank, setShowAddBank] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newBankColor, setNewBankColor] = useState(BANK_COLORS[0]);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeBankForUpload, setActiveBankForUpload] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const unidentified = transactions.filter((t) => t.category === "Não identificado");
  const identified = transactions.filter((t) => t.category !== "Não identificado");
  const monthsSpan = useMemo(() => {
    if (!transactions.length) return 0;
    const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
    return set.size;
  }, [transactions]);

  function handleAddBank() {
    if (!newBankName.trim()) return;
    const bank: Bank = {
      id: `bank-${Date.now()}`,
      name: newBankName.trim(),
      color: newBankColor,
    };
    setBanks((b) => [...b, bank]);
    setNewBankName("");
    setNewBankColor(BANK_COLORS[(banks.length + 1) % BANK_COLORS.length]);
    setShowAddBank(false);
    toast.success(`${bank.name} adicionado`);
  }

  function handleRemoveBank(id: string) {
    setBanks((b) => b.filter((x) => x.id !== id));
    setTransactions((t) => t.filter((x) => x.bankId !== id));
  }

  async function processFiles(files: FileList | File[], bankId: string) {
    const list = Array.from(files);
    let total = 0;
    for (const f of list) {
      const text = await f.text();
      const lower = f.name.toLowerCase();
      let parsed: Tx[] = [];
      if (lower.endsWith(".ofx") || text.includes("<OFX") || text.includes("<STMTTRN")) {
        parsed = parseOFXTransactions(text, bankId);
      } else {
        parsed = parseCSVTransactions(text, bankId);
      }
      total += parsed.length;
      setTransactions((prev) => [...prev, ...parsed]);
    }
    toast.success(`${total} transações importadas`);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!banks.length) {
      toast.error("Adicione um banco primeiro");
      return;
    }
    if (!activeBankForUpload) {
      toast.error("Selecione o banco antes de soltar arquivos");
      return;
    }
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files, activeBankForUpload);
    }
  }

  function updateCategory(txId: string, cat: CategoryKey) {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, category: cat, autoCategorized: false } : t))
    );
  }

  function bankOf(id: string): Bank | undefined {
    return banks.find((b) => b.id === id);
  }

  // ── Diagnosis calculations ──
  const diagnosis = useMemo(() => {
    if (!identified.length) return null;
    // monthly entry vs exit
    const byMonth: Record<string, { income: number; expense: number }> = {};
    for (const t of identified) {
      const m = t.date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 };
      if (t.amount > 0) byMonth[m].income += t.amount;
      else byMonth[m].expense += Math.abs(t.amount);
    }
    const months = Object.keys(byMonth).sort();
    const monthCount = months.length || 1;

    // top 5 expense categories
    const catTotals: Record<string, number> = {};
    for (const t of identified) {
      if (t.amount < 0 && t.category !== "Transferência" && t.category !== "Salário") {
        catTotals[t.category] = (catTotals[t.category] || 0) + Math.abs(t.amount);
      }
    }
    const topCats = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, total]) => ({ cat, total, monthlyAvg: total / monthCount }));

    // top 10 merchants
    const merchTotals: Record<string, { count: number; total: number }> = {};
    for (const t of identified) {
      if (t.amount < 0) {
        const key = t.merchant.toUpperCase().slice(0, 30);
        if (!merchTotals[key]) merchTotals[key] = { count: 0, total: 0 };
        merchTotals[key].count++;
        merchTotals[key].total += Math.abs(t.amount);
      }
    }
    const topMerchants = Object.entries(merchTotals)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([m, v]) => ({ merchant: m, count: v.count, avg: v.total / v.count, total: v.total }));

    // suggested budget per category (avg + 5% buffer)
    const suggested = topCats.map((c) => ({
      cat: c.cat,
      suggested: Math.round(c.monthlyAvg * 1.05),
    }));

    return { byMonth, months, topCats, topMerchants, suggested, monthCount };
  }, [identified]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Análise de extratos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload dos seus extratos (CSV ou OFX) e gere um diagnóstico automático do seu fluxo financeiro.
        </p>
      </div>

      {/* Recommendation */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-foreground">
          <span className="font-medium">Recomendamos pelo menos 3 meses de extratos</span> para uma análise mais precisa.
          {monthsSpan > 0 && (
            <span className="ml-1 text-muted-foreground">
              · Atualmente: {monthsSpan} {monthsSpan === 1 ? "mês" : "meses"} de dados
            </span>
          )}
        </p>
      </div>

      {/* Banks management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="text-base">Bancos</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Adicione cada banco do qual você tem um extrato
            </p>
          </div>
          <Dialog open={showAddBank} onOpenChange={setShowAddBank}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" /> Banco
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar banco</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome do banco</Label>
                  <Input
                    placeholder="Ex: Nubank, Itaú, Bradesco"
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <Label>Cor</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BANK_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewBankColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          newBankColor === c ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddBank} disabled={!newBankName.trim()}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {banks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum banco adicionado ainda
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {banks.map((b) => {
                const count = transactions.filter((t) => t.bankId === b.id).length;
                const isActive = activeBankForUpload === b.id;
                return (
                  <div
                    key={b.id}
                    className={`rounded-lg border p-3 flex items-center gap-3 transition-all cursor-pointer ${
                      isActive ? "border-primary bg-primary/5" : "hover:border-primary/40"
                    }`}
                    onClick={() => setActiveBankForUpload(b.id)}
                  >
                    <div
                      className="h-10 w-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{count} transações</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBank(b.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload area */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload de extratos</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeBankForUpload
              ? `Enviando para: ${bankOf(activeBankForUpload)?.name}`
              : "Selecione um banco acima para anexar arquivos"}
          </p>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (!activeBankForUpload) {
                toast.error("Selecione um banco primeiro");
                return;
              }
              fileInputRef.current?.click();
            }}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Arraste arquivos CSV ou OFX aqui
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ou clique para selecionar
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.ofx,text/csv"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && activeBankForUpload) {
                  processFiles(e.target.files, activeBankForUpload);
                  e.target.value = "";
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Unidentified transactions */}
      {unidentified.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Transações para identificar
              <Badge variant="secondary">{unidentified.length}</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Classifique estas antes de gerar o diagnóstico
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-background overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-28">Banco</TableHead>
                    <TableHead className="w-32 text-right">Valor</TableHead>
                    <TableHead className="w-48">Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unidentified.map((t) => {
                    const bank = bankOf(t.bankId);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs">{t.date}</TableCell>
                        <TableCell className="text-sm">{t.merchant}</TableCell>
                        <TableCell>
                          {bank && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: bank.color }}
                              />
                              <span className="text-xs">{bank.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-medium ${
                            t.amount < 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {fmt(t.amount)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={t.category}
                            onValueChange={(v) => updateCategory(t.id, v as CategoryKey)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" className="z-[9999]">
                              {CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Identified transactions */}
      {identified.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Transações classificadas
                <Badge variant="secondary">{identified.length}</Badge>
              </CardTitle>
            </div>
            <Button
              size="sm"
              className="gap-1.5"
              disabled={unidentified.length > 0}
              onClick={() => setShowDiagnosis(true)}
            >
              <Sparkles className="h-4 w-4" />
              Gerar diagnóstico
            </Button>
          </CardHeader>
          <CardContent>
            {unidentified.length > 0 && (
              <p className="text-xs text-amber-600 mb-3">
                Classifique todas as {unidentified.length} transações pendentes para gerar o diagnóstico.
              </p>
            )}
            <div className="rounded-md border overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-24">Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-28">Banco</TableHead>
                    <TableHead className="w-32 text-right">Valor</TableHead>
                    <TableHead className="w-48">Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {identified.map((t) => {
                    const bank = bankOf(t.bankId);
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs">{t.date}</TableCell>
                        <TableCell className="text-sm">{t.merchant}</TableCell>
                        <TableCell>
                          {bank && (
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: bank.color }}
                              />
                              <span className="text-xs">{bank.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm font-medium ${
                            t.amount < 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {fmt(t.amount)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={t.category}
                            onValueChange={(v) => updateCategory(t.id, v as CategoryKey)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" className="z-[9999]">
                              {CATEGORIES.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Dialog */}
      <Dialog open={showDiagnosis} onOpenChange={setShowDiagnosis}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Diagnóstico do seu fluxo financeiro
            </DialogTitle>
          </DialogHeader>

          {diagnosis && <DiagnosisView d={diagnosis} fmt={fmt} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Diagnosis sub-component
// ────────────────────────────────────────────────────────────────────
function DiagnosisView({
  d,
  fmt,
}: {
  d: NonNullable<ReturnType<() => any>>;
  fmt: (n: number) => string;
}) {
  const maxFlow = Math.max(
    ...d.months.map((m: string) =>
      Math.max(d.byMonth[m].income, d.byMonth[m].expense)
    ),
    1
  );

  return (
    <div className="space-y-6 pt-2">
      {/* Monthly flow */}
      <section>
        <h3 className="text-sm font-semibold mb-3">Entradas vs Saídas por mês</h3>
        <div className="space-y-2">
          {d.months.map((m: string) => {
            const { income, expense } = d.byMonth[m];
            const balance = income - expense;
            return (
              <div key={m} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{m}</span>
                  <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                    {balance >= 0 ? "+" : ""}
                    {fmt(balance)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-green-600 flex-shrink-0" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(income / maxFlow) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-20 text-right">
                      {fmt(income)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3 w-3 text-red-600 flex-shrink-0" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${(expense / maxFlow) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-20 text-right">
                      {fmt(expense)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top categories */}
      <section>
        <h3 className="text-sm font-semibold mb-3">Top 5 categorias de gasto</h3>
        <div className="space-y-2">
          {d.topCats.map((c: any, i: number) => (
            <div
              key={c.cat}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground w-5">
                  #{i + 1}
                </span>
                <span className="text-sm font-medium">{c.cat}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{fmt(c.total)}</p>
                <p className="text-[10px] text-muted-foreground">
                  Média: {fmt(c.monthlyAvg)}/mês
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top merchants */}
      <section>
        <h3 className="text-sm font-semibold mb-3">Top 10 comerciantes recorrentes</h3>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comerciante</TableHead>
                <TableHead className="text-right w-16">Freq.</TableHead>
                <TableHead className="text-right w-28">Médio</TableHead>
                <TableHead className="text-right w-28">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.topMerchants.map((m: any) => (
                <TableRow key={m.merchant}>
                  <TableCell className="text-xs">{m.merchant}</TableCell>
                  <TableCell className="text-right text-xs">{m.count}x</TableCell>
                  <TableCell className="text-right text-xs">{fmt(m.avg)}</TableCell>
                  <TableCell className="text-right text-xs font-medium">
                    {fmt(m.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Suggested budget */}
      <section>
        <h3 className="text-sm font-semibold mb-1">Orçamento sugerido</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Baseado na média dos {d.monthCount} {d.monthCount === 1 ? "mês" : "meses"} analisados (+5% de margem)
        </p>
        <div className="space-y-2">
          {d.suggested.map((s: any) => (
            <div
              key={s.cat}
              className="flex items-center justify-between rounded-md border p-3 bg-primary/5"
            >
              <span className="text-sm font-medium">{s.cat}</span>
              <span className="text-sm font-bold text-primary">{fmt(s.suggested)}/mês</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
