import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent,
} from "@/components/ui/drawer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type TxType = "expense" | "income" | "transfer";
type Curr = "BRL" | "USD" | "EUR" | "PYG";

interface Cat { id: string; name: string; icon: string; type: string; }
interface Acct { id: string; account_name: string; institution_name: string; balance: number; currency: string; }

export function QuickAddButton() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Data
  const [categories, setCategories] = useState<Cat[]>([]);
  const [accounts, setAccounts] = useState<Acct[]>([]);

  // Form
  const [amount, setAmount] = useState("");
  const [txType, setTxType] = useState<TxType>("expense");
  const [currency, setCurrency] = useState<Curr>("BRL");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [postedAt, setPostedAt] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showDetails, setShowDetails] = useState(false);
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [catRes, acctRes] = await Promise.all([
      supabase.from("categories").select("id, name, icon, type").order("name"),
      supabase.from("accounts").select("id, account_name, institution_name, balance, currency").order("institution_name"),
    ]);
    if (catRes.data) setCategories(catRes.data as Cat[]);
    if (acctRes.data) setAccounts(acctRes.data as Acct[]);
  }, [user]);

  useEffect(() => { if (open) fetchData(); }, [open, fetchData]);
  useEffect(() => { if (open) setTimeout(() => amountRef.current?.focus(), 100); }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "n" || e.key === "N") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredCategories = categories.filter(c =>
    txType === "expense" ? c.type === "expense" :
    txType === "income" ? c.type === "income" :
    c.type === "transfer"
  );

  const resetForm = () => {
    setAmount(""); setTxType("expense"); setCurrency("BRL");
    setCategoryId(""); setAccountId(""); setPostedAt(format(new Date(), "yyyy-MM-dd"));
    setShowDetails(false); setMerchant(""); setNotes("");
  };

  const handleSave = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error("Informe o valor"); return; }
    if (!user) return;

    setSaving(true);
    const finalAmount = txType === "expense" ? -Math.abs(val) : Math.abs(val);
    const cat = categories.find(c => c.id === categoryId);

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      account_id: accountId || null,
      category_id: categoryId || null,
      amount: finalAmount,
      currency,
      posted_at: new Date(postedAt + "T12:00:00").toISOString(),
      merchant: merchant.trim() || (cat?.name || (txType === "income" ? "Receita" : "Despesa")),
      category_source: "manual",
      source: "manual",
      status: "posted",
      description_raw: notes.trim() || null,
    });

    setSaving(false);
    if (error) { toast.error("Erro ao registrar"); console.error(error); return; }

    const label = cat ? `${cat.icon} ${cat.name}` : (txType === "income" ? "Receita" : "Despesa");
    toast.success(`${txType === "income" ? "Receita" : "Gasto"} registrado! ${currency} ${val.toFixed(2)} em ${label}`);
    queryClient.invalidateQueries();
    setOpen(false);
    resetForm();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && parseFloat(amount) > 0) { e.preventDefault(); handleSave(); }
  };

  const formContent = (
    <div className="space-y-5 p-1" onKeyDown={handleKeyDown}>
      {/* Step 1 — Amount & Type */}
      <div className="text-center space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registro rápido</p>
        <div className="flex items-center justify-center gap-2">
          <Select value={currency} onValueChange={v => setCurrency(v as Curr)}>
            <SelectTrigger className="w-20 text-xs h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["BRL", "USD", "EUR", "PYG"] as Curr[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            ref={amountRef}
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0,00"
            className="text-center text-3xl font-bold h-14 w-48 border-none shadow-none focus-visible:ring-0 tabular-nums"
            step="0.01"
            min="0"
          />
        </div>
        <div className="flex justify-center gap-1">
          {([
            { value: "expense" as TxType, label: "Saída", cls: "text-destructive border-destructive/30 bg-destructive/5" },
            { value: "income" as TxType, label: "Entrada", cls: "text-income border-[hsl(var(--income)/0.3)] bg-[hsl(var(--income-bg))]" },
            { value: "transfer" as TxType, label: "Transferência", cls: "text-primary border-primary/30 bg-primary/5" },
          ]).map(t => (
            <button key={t.value} onClick={() => { setTxType(t.value); setCategoryId(""); }}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold border transition-all",
                txType === t.value ? t.cls : "border-border text-muted-foreground hover:border-primary/30"
              )}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Category, Account, Date */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Categoria</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
            <SelectContent>
              {filteredCategories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Conta</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.institution_name} · {a.account_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Data</Label>
            <Input type="date" value={postedAt} onChange={e => setPostedAt(e.target.value)} className="h-9" />
          </div>
        </div>
      </div>

      {/* Step 3 — Optional details */}
      <Collapsible open={showDetails} onOpenChange={setShowDetails}>
        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
          <ChevronDown className={cn("h-3 w-3 transition-transform", showDetails && "rotate-180")} />
          Adicionar detalhes
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3">
          <div>
            <Label className="text-xs">Descrição / Estabelecimento</Label>
            <Input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Ex: Supermercado, Uber..." className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Nota</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações..." className="min-h-[60px] text-xs" />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving || !parseFloat(amount)} className="w-full gap-2">
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        title="Registro rápido (N)"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>

      {/* Mobile: Drawer / Desktop: Dialog */}
      {isMobile ? (
        <Drawer open={open} onOpenChange={o => { setOpen(o); if (!o) resetForm(); }}>
          <DrawerContent className="px-4 pb-6 pt-2 max-h-[90vh] overflow-y-auto">
            {formContent}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) resetForm(); }}>
          <DialogContent className="sm:max-w-md">
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
