import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { type Currency } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onCreated: () => void;
}

interface DbCategory {
  id: string;
  name: string;
  icon: string;
  type: string;
  parent_id: string | null;
}

const ICON_OPTIONS = ["📁","🏠","🍽️","🚗","📺","💰","💼","🎯","🛒","🎬","💻","⚡","🏗️","📱","↔️","💸","🎓","🏥","✈️","🎮","👕","🐾"];

export function ManualTransactionForm({ onCreated }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [categoryId, setCategoryId] = useState("");
  const [postedAt, setPostedAt] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"expense" | "income">("expense");

  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📁");
  const [newCatParent, setNewCatParent] = useState<string>("none");
  const [savingCat, setSavingCat] = useState(false);

  useEffect(() => {
    if (user) fetchCategories();
  }, [user]);

  async function fetchCategories() {
    const { data } = await supabase
      .from("categories")
      .select("id, name, icon, type, parent_id")
      .eq("user_id", user!.id)
      .order("name");
    if (data) setCategories(data);
  }

  const filteredCategories = categories.filter(
    (c) => c.type === (type === "income" ? "income" : "expense")
  );

  const parentCategories = filteredCategories.filter((c) => !c.parent_id);
  const getChildren = (pid: string) => filteredCategories.filter((c) => c.parent_id === pid);

  async function handleCreateCategory() {
    if (!user || !newCatName.trim()) return;
    setSavingCat(true);
    const { data, error } = await supabase.from("categories").insert({
      user_id: user.id,
      name: newCatName.trim(),
      icon: newCatIcon,
      type: type === "income" ? "income" : "expense",
      parent_id: newCatParent === "none" ? null : newCatParent,
    }).select("id").single();

    setSavingCat(false);
    if (error) {
      toast.error("Erro ao criar categoria");
    } else {
      toast.success("Categoria criada!");
      setNewCatName("");
      setNewCatIcon("📁");
      setNewCatParent("none");
      setShowNewCat(false);
      await fetchCategories();
      if (data) setCategoryId(data.id);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const numAmount = parseFloat(amount);
    const finalAmount = type === "expense" ? -Math.abs(numAmount) : Math.abs(numAmount);

    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      merchant,
      amount: finalAmount,
      currency,
      category_id: categoryId || null,
      category_source: "manual",
      source: "manual",
      posted_at: new Date(postedAt).toISOString(),
      description_raw: merchant,
    });

    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar movimentação");
      console.error(error);
    } else {
      toast.success("Movimentação registrada!");
      setOpen(false);
      resetForm();
      onCreated();
    }
  }

  function resetForm() {
    setMerchant("");
    setAmount("");
    setCurrency("BRL");
    setCategoryId("");
    setPostedAt(new Date().toISOString().slice(0, 10));
    setType("expense");
    setShowNewCat(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova movimentação manual</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={type === "expense" ? "default" : "outline"}
              onClick={() => { setType("expense"); setCategoryId(""); }}
              className="flex-1"
            >
              Despesa
            </Button>
            <Button
              type="button"
              size="sm"
              variant={type === "income" ? "default" : "outline"}
              onClick={() => { setType("income"); setCategoryId(""); }}
              className="flex-1"
            >
              Receita
            </Button>
          </div>

          <div>
            <Label htmlFor="merchant">Descrição / Estabelecimento</Label>
            <Input
              id="merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Ex: Supermercado, Salário..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div>
              <Label htmlFor="currency">Moeda</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[9999]">
                  <SelectItem value="BRL">🇧🇷 BRL</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD</SelectItem>
                  <SelectItem value="PYG">🇵🇾 PYG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="category">Categoria</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={() => setShowNewCat(!showNewCat)}
              >
                <Plus className="h-3 w-3" />
                {showNewCat ? "Cancelar" : "Nova"}
              </Button>
            </div>

            {showNewCat ? (
              <div className="space-y-2 rounded-md border p-3 bg-muted/50">
                <div className="flex gap-2">
                  <Select value={newCatIcon} onValueChange={setNewCatIcon}>
                    <SelectTrigger className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[9999]">
                      {ICON_OPTIONS.map((ic) => (
                        <SelectItem key={ic} value={ic}>{ic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Nome da categoria"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                </div>
                <Select value={newCatParent} onValueChange={setNewCatParent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria pai (opcional)" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[9999]">
                    <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                    {parentCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={savingCat || !newCatName.trim()}
                  onClick={handleCreateCategory}
                >
                  {savingCat ? "Criando..." : "Criar categoria"}
                </Button>
              </div>
            ) : (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[9999]">
                  {parentCategories.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Nenhuma categoria. Clique em "Nova" para criar.
                    </div>
                  )}
                  {parentCategories.map((parent) => {
                    const children = getChildren(parent.id);
                    if (children.length === 0) {
                      return (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.icon} {parent.name}
                        </SelectItem>
                      );
                    }
                    return [
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.icon} {parent.name}
                      </SelectItem>,
                      ...children.map((child) => (
                        <SelectItem key={child.id} value={child.id}>
                          &nbsp;&nbsp;{child.icon} {child.name}
                        </SelectItem>
                      )),
                    ];
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={postedAt}
              onChange={(e) => setPostedAt(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Registrar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
