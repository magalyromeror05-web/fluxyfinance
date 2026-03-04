import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mockCategories, type Currency } from "@/data/mockData";
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

  const leafCategories = mockCategories.filter(
    (c) => c.type === (type === "income" ? "income" : "expense")
  );

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
          {/* Type toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={type === "expense" ? "default" : "outline"}
              onClick={() => setType("expense")}
              className="flex-1"
            >
              Despesa
            </Button>
            <Button
              type="button"
              size="sm"
              variant={type === "income" ? "default" : "outline"}
              onClick={() => setType("income")}
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
                <SelectContent>
                  <SelectItem value="BRL">🇧🇷 BRL</SelectItem>
                  <SelectItem value="USD">🇺🇸 USD</SelectItem>
                  <SelectItem value="PYG">🇵🇾 PYG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {leafCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
