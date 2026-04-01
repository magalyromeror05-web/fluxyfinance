import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CurrencyBadge } from "@/components/CurrencyBadge";
import { formatCurrency, type Currency } from "@/types/database";
import { ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EmojiPicker } from "@/components/EmojiPicker";

interface DbCategory {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  type: string;
  icon: string;
  created_at: string;
}

const ALL = "ALL" as const;
type Filter = Currency | typeof ALL;

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(ALL);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbCategory | null>(null);

  // Form
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [type, setType] = useState("expense");
  const [parentId, setParentId] = useState<string>("none");

  const currencies: Currency[] = ["BRL", "USD", "PYG"];

  const fetchData = async () => {
    const [catRes, txRes] = await Promise.all([
      supabase.from("categories").select("*").order("created_at", { ascending: true }),
      supabase.from("transactions").select("id, amount, currency, category_id"),
    ]);
    if (catRes.error) {
      toast.error("Erro ao carregar categorias");
      console.error(catRes.error);
    } else {
      setCategories((catRes.data as DbCategory[]) || []);
    }
    setTransactions(txRes.data || []);
    setLoading(false);
  };

  const fetchCategories = fetchData;

  useEffect(() => { fetchData(); }, []);

  const topLevel = categories.filter(c => !c.parent_id);
  const getChildren = (pid: string) => categories.filter(c => c.parent_id === pid);

  const toggle = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const getCategoryTotal = (categoryId: string, currency?: Currency) => {
    const childIds = [categoryId, ...categories.filter(c => c.parent_id === categoryId).map(c => c.id)];
    return transactions
      .filter(t => childIds.includes(t.category_id) && (currency ? t.currency === currency : true))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  };

  const resetForm = () => {
    setName(""); setIcon("📁"); setType("expense"); setParentId("none"); setEditing(null);
  };

  const openCreate = (presetParent?: string) => {
    resetForm();
    if (presetParent) setParentId(presetParent);
    setDialogOpen(true);
  };

  const openEdit = (cat: DbCategory) => {
    setEditing(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setType(cat.type);
    setParentId(cat.parent_id || "none");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Preencha o nome"); return; }

    const payload = {
      user_id: user!.id,
      name: name.trim(),
      icon,
      type,
      parent_id: parentId === "none" ? null : parentId,
    };

    if (editing) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Categoria atualizada");
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast.error("Erro ao criar categoria"); return; }
      toast.success("Categoria criada");
    }
    setDialogOpen(false);
    resetForm();
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Categoria excluída");
    fetchCategories();
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categorias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Árvore de categorias com drill-down por moeda.
          </p>
        </div>
        <Button onClick={() => openCreate()} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {([ALL, "BRL", "USD", "PYG"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold transition-colors border",
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/40"
            )}
          >
            {f === ALL ? "Todas" : f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : categories.length === 0 ? (
        <div className="atlas-card p-8 text-center fade-in">
          <p className="text-muted-foreground mb-4">Nenhuma categoria criada ainda.</p>
          <Button onClick={() => openCreate()} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Categoria
          </Button>
        </div>
      ) : (
        <div className="atlas-card overflow-hidden fade-in">
          {topLevel.map((cat, i) => {
            const children = getChildren(cat.id);
            const isOpen = expanded.includes(cat.id);
            const hasChildren = children.length > 0;

            const totalForCurrencies = filter === ALL
              ? currencies.map(cur => ({ cur, val: getCategoryTotal(cat.id, cur) })).filter(x => x.val > 0)
              : [{ cur: filter as Currency, val: getCategoryTotal(cat.id, filter as Currency) }].filter(x => x.val > 0);

            return (
              <div key={cat.id}>
                {i > 0 && <div className="border-t border-border" />}
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors group">
                  <button
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                    onClick={() => hasChildren && toggle(cat.id)}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize">{cat.type === "expense" ? "despesa" : cat.type === "income" ? "receita" : "transferência"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {totalForCurrencies.map(({ cur, val }) => (
                        <div key={cur} className="text-right">
                          <p className="text-xs font-semibold tabular-nums text-foreground">
                            {formatCurrency(val, cur as Currency)}
                          </p>
                          <CurrencyBadge currency={cur as Currency} size="sm" />
                        </div>
                      ))}
                    </div>
                    {hasChildren && (
                      <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform flex-shrink-0", isOpen && "rotate-90")} />
                    )}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openCreate(cat.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors" title="Adicionar subcategoria">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => openEdit(cat)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isOpen && children.map(child => (
                  <div key={child.id} className="border-t border-border bg-muted/20 flex items-center gap-3 px-4 py-3 pl-12 group">
                    <span className="text-base">{child.icon}</span>
                    <p className="text-sm text-foreground flex-1">{child.name}</p>
                    {(filter === ALL ? currencies : [filter as Currency]).map(cur => {
                      const val = getCategoryTotal(child.id, cur);
                      if (!val) return null;
                      return (
                        <div key={cur} className="text-right">
                          <p className="text-xs font-semibold tabular-nums text-foreground">
                            {formatCurrency(val, cur)}
                          </p>
                          <CurrencyBadge currency={cur} size="sm" />
                        </div>
                      );
                    })}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(child)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(child.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nome</Label>
              <Input placeholder="Ex: Alimentação" value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="transfer">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria Pai</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                    {topLevel.filter(c => c.id !== editing?.id).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Ícone</Label>
              <div className="flex items-center gap-3 mt-1">
                <EmojiPicker value={icon} onChange={setIcon} />
                <span className="text-sm text-muted-foreground">Clique para escolher um emoji</span>
              </div>
            </div>

            <Button onClick={handleSave} className="w-full">
              {editing ? "Salvar Alterações" : "Criar Categoria"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
