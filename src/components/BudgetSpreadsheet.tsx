import { useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/data/mockData";
import { Copy, Download, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, endOfMonth, addMonths, subMonths, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DbCategory {
  id: string; name: string; icon: string; type: string; parent_id: string | null;
}

interface Budget {
  id: string; user_id: string; currency: string; category_id: string | null;
  name: string; amount: number; period: string; period_start_day: number;
  period_month: string | null; is_recurring: boolean; healthy_pct: number | null;
  created_at: string; updated_at: string;
}

interface SpreadsheetRow {
  id: string | null;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  isChild: boolean;
  isGroupHeader: boolean;
  parentId: string | null;
  budgeted: number;
  realized: number;
  diff: number;
  pct: number;
  type: "income" | "expense" | "investment";
}

interface BudgetSpreadsheetProps {
  budgets: Budget[];
  categories: DbCategory[];
  transactions: any[];
  selectedMonth: string;
  onRefresh: () => void;
}

const monthOptions: string[] = [];
for (let i = -6; i <= 6; i++) monthOptions.push(format(addMonths(new Date(), i), "yyyy-MM"));

function getMonthLabel(m: string) {
  const d = parse(m + "-01", "yyyy-MM-dd", new Date());
  return format(d, "MMMM yyyy", { locale: ptBR });
}

export function BudgetSpreadsheet({ budgets, categories, transactions, selectedMonth: initialMonth, onRefresh }: BudgetSpreadsheetProps) {
  const { user } = useAuth();
  const [month, setMonth] = useState(initialMonth);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const mBudgets = useMemo(() => budgets.filter(b => b.period_month === month), [budgets, month]);

  const monthRange = useMemo(() => {
    const monthDate = parse(month + "-01", "yyyy-MM-dd", new Date());
    return {
      start: new Date(monthDate.getFullYear(), monthDate.getMonth(), 1),
      end: endOfMonth(monthDate),
    };
  }, [month]);

  const monthTx = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.posted_at);
      return d >= monthRange.start && d <= monthRange.end;
    });
  }, [transactions, monthRange]);

  const getRealized = useCallback((categoryId: string, catType: string) => {
    const childIds = [categoryId, ...categories.filter(c => c.parent_id === categoryId).map(c => c.id)];
    return monthTx
      .filter(t => childIds.includes(t.category_id) && (
        catType === "income" ? t.amount > 0 : t.amount < 0
      ))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  }, [monthTx, categories]);

  const buildSection = useCallback((type: "income" | "expense" | "investment"): SpreadsheetRow[] => {
    const typeCats = categories.filter(c => c.type === type);
    const parents = typeCats.filter(c => !c.parent_id).sort((a, b) => a.name.localeCompare(b.name));
    const rows: SpreadsheetRow[] = [];

    for (const parent of parents) {
      const children = typeCats.filter(c => c.parent_id === parent.id).sort((a, b) => a.name.localeCompare(b.name));
      const hasChildren = children.length > 0;

      if (hasChildren) {
        let groupBudgeted = 0, groupRealized = 0;
        const childRows: SpreadsheetRow[] = [];

        for (const child of children) {
          const budget = mBudgets.find(b => b.category_id === child.id);
          const realized = getRealized(child.id, type);
          const budgeted = budget?.amount || 0;
          groupBudgeted += budgeted;
          groupRealized += realized;
          childRows.push({
            id: budget?.id || null,
            categoryId: child.id,
            categoryName: child.name,
            categoryIcon: child.icon,
            isChild: true,
            isGroupHeader: false,
            parentId: parent.id,
            budgeted,
            realized,
            diff: budgeted - realized,
            pct: budgeted > 0 ? (realized / budgeted) * 100 : 0,
            type,
          });
        }

        rows.push({
          id: null,
          categoryId: parent.id,
          categoryName: parent.name,
          categoryIcon: parent.icon,
          isChild: false,
          isGroupHeader: true,
          parentId: null,
          budgeted: groupBudgeted,
          realized: groupRealized,
          diff: groupBudgeted - groupRealized,
          pct: groupBudgeted > 0 ? (groupRealized / groupBudgeted) * 100 : 0,
          type,
        });
        rows.push(...childRows);
      } else {
        const budget = mBudgets.find(b => b.category_id === parent.id);
        const realized = getRealized(parent.id, type);
        const budgeted = budget?.amount || 0;
        rows.push({
          id: budget?.id || null,
          categoryId: parent.id,
          categoryName: parent.name,
          categoryIcon: parent.icon,
          isChild: false,
          isGroupHeader: false,
          parentId: null,
          budgeted,
          realized,
          diff: budgeted - realized,
          pct: budgeted > 0 ? (realized / budgeted) * 100 : 0,
          type,
        });
      }
    }

    return rows.filter((row, _i, arr) => {
      if (row.isGroupHeader) {
        return arr.some(r => r.parentId === row.categoryId && (r.budgeted > 0 || r.realized > 0));
      }
      return row.budgeted > 0 || row.realized > 0;
    });
  }, [categories, mBudgets, getRealized]);

  const incomeRows = useMemo(() => buildSection("income"), [buildSection]);
  const expenseRows = useMemo(() => buildSection("expense"), [buildSection]);
  const investmentRows = useMemo(() => buildSection("investment"), [buildSection]);

  const totalIncomeBudgeted = incomeRows.filter(r => !r.isGroupHeader).reduce((s, r) => s + r.budgeted, 0);
  const totalIncomeRealized = incomeRows.filter(r => !r.isGroupHeader).reduce((s, r) => s + r.realized, 0);
  const totalExpenseBudgeted = expenseRows.filter(r => !r.isGroupHeader).reduce((s, r) => s + r.budgeted, 0);
  const totalExpenseRealized = expenseRows.filter(r => !r.isGroupHeader).reduce((s, r) => s + r.realized, 0);
  const totalInvestBudgeted = investmentRows.filter(r => !r.isGroupHeader).reduce((s, r) => s + r.budgeted, 0);
  const totalInvestRealized = investmentRows.filter(r => !r.isGroupHeader).reduce((s, r) => s + r.realized, 0);

  const saldoRealized = totalIncomeRealized - totalExpenseRealized - totalInvestRealized;
  const savingsRate = totalIncomeRealized > 0 ? (saldoRealized / totalIncomeRealized) * 100 : 0;

  const startEdit = (rowKey: string, currentValue: number) => {
    setEditingCell(rowKey);
    setEditValue(String(currentValue || ""));
  };

  const saveEdit = async (row: SpreadsheetRow) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) { setEditingCell(null); return; }

    if (row.id) {
      const { error } = await supabase.from("budgets").update({
        amount: val, updated_at: new Date().toISOString(),
      }).eq("id", row.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
    } else {
      const cat = categories.find(c => c.id === row.categoryId);
      const { error } = await supabase.from("budgets").insert({
        user_id: user!.id,
        name: cat?.name || "Orçamento",
        currency: "BRL",
        category_id: row.categoryId,
        amount: val,
        period: "monthly",
        period_start_day: 1,
        period_month: month,
        is_recurring: false,
        updated_at: new Date().toISOString(),
      });
      if (error) { toast.error("Erro ao criar"); return; }
    }
    setEditingCell(null);
    onRefresh();
  };

  const handleDeleteBudget = async (budgetId: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Orçamento excluído");
    onRefresh();
  };

  const handleDuplicatePreviousMonth = async () => {
    const prevMonth = format(subMonths(parse(month + "-01", "yyyy-MM-dd", new Date()), 1), "yyyy-MM");
    const prevBudgets = budgets.filter(b => b.period_month === prevMonth);
    if (prevBudgets.length === 0) { toast.info("Nenhum orçamento no mês anterior"); return; }
    const rows = prevBudgets.map(b => ({
      user_id: user!.id, name: b.name, currency: b.currency, category_id: b.category_id,
      amount: b.amount, period: "monthly", period_start_day: b.period_start_day,
      period_month: month, is_recurring: b.is_recurring, healthy_pct: b.healthy_pct,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("budgets").insert(rows);
    if (error) { toast.error("Erro ao duplicar"); return; }
    toast.success("Orçamento duplicado! Revise os valores.");
    onRefresh();
  };

  const exportCSV = () => {
    const lines: string[] = ["Categoria,Orçado,Realizado,Diferença,%"];
    const addSection = (label: string, rows: SpreadsheetRow[]) => {
      lines.push("");
      lines.push(label);
      for (const r of rows) {
        const prefix = r.isChild ? "  └ " : "";
        lines.push(`${prefix}${r.categoryName},${r.budgeted.toFixed(2)},${r.realized.toFixed(2)},${r.diff.toFixed(2)},${Math.round(r.pct)}%`);
      }
    };
    addSection("ENTRADAS", incomeRows);
    addSection("SAÍDAS", expenseRows);
    if (investmentRows.length > 0) addSection("APLICAÇÕES", investmentRows);
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planilha-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const exportPDF = () => {
    const lines: string[] = [];
    lines.push(`PLANILHA FINANCEIRA — ${getMonthLabel(month).toUpperCase()}`);
    lines.push("=".repeat(60));
    lines.push("");
    const addSection = (label: string, rows: SpreadsheetRow[], totalB: number, totalR: number) => {
      lines.push(label);
      lines.push("-".repeat(60));
      for (const r of rows) {
        const name = (r.isChild ? "  └ " : "") + r.categoryName;
        lines.push(`${name.padEnd(25)} ${formatCurrency(r.budgeted, "BRL").padStart(12)} ${formatCurrency(r.realized, "BRL").padStart(12)}`);
      }
      lines.push(`TOTAL: ${formatCurrency(totalB, "BRL").padStart(12)} ${formatCurrency(totalR, "BRL").padStart(12)}`);
      lines.push("");
    };
    addSection("ENTRADAS", incomeRows, totalIncomeBudgeted, totalIncomeRealized);
    addSection("SAÍDAS", expenseRows, totalExpenseBudgeted, totalExpenseRealized);
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `planilha-${month}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado");
  };

  const renderRow = (row: SpreadsheetRow, sectionType: string) => {
    const key = `${row.categoryId}-${sectionType}`;
    const isEditing = editingCell === key;
    const overBudget = row.realized > row.budgeted && row.budgeted > 0;
    const noSpending = row.realized === 0 && row.budgeted > 0;

    if (row.isGroupHeader) {
      return (
        <tr key={key} className="bg-muted/50 font-semibold">
          <td className="p-2.5 pl-3 text-sm text-foreground">{row.categoryIcon} {row.categoryName}</td>
          <td className="p-2.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(row.budgeted, "BRL")}</td>
          <td className="p-2.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(row.realized, "BRL")}</td>
          <td className={cn("p-2.5 text-right text-sm tabular-nums font-medium", row.diff >= 0 ? "text-income" : "text-destructive")}>
            {row.diff >= 0 ? "+" : ""}{formatCurrency(row.diff, "BRL")}
          </td>
          <td className="p-2.5 text-right text-sm tabular-nums text-muted-foreground">{Math.round(row.pct)}%</td>
          <td className="p-2.5 w-8"></td>
        </tr>
      );
    }

    return (
      <tr key={key} className={cn("border-b border-border/50 hover:bg-muted/30 transition-colors group", overBudget && "bg-destructive/5", noSpending && !overBudget && "bg-amber-50/50")}>
        <td className={cn("p-2.5 text-sm text-foreground", row.isChild ? "pl-8" : "pl-3")}>
          {row.isChild && <span className="text-muted-foreground mr-1">└</span>}{row.categoryIcon} {row.categoryName}
        </td>
        <td className="p-2.5 text-right text-sm tabular-nums">
          {isEditing ? (
            <Input type="number" className="w-24 h-7 text-xs text-right ml-auto" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEdit(row); if (e.key === "Escape") setEditingCell(null); }} onBlur={() => saveEdit(row)} autoFocus />
          ) : (
            <span className="cursor-pointer hover:underline text-foreground" onClick={() => startEdit(key, row.budgeted)}>{formatCurrency(row.budgeted, "BRL")}</span>
          )}
        </td>
        <td className="p-2.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(row.realized, "BRL")}</td>
        <td className={cn("p-2.5 text-right text-sm tabular-nums font-medium", row.diff >= 0 ? "text-income" : "text-destructive")}>
          {row.diff >= 0 ? "+" : ""}{formatCurrency(row.diff, "BRL")}
        </td>
        <td className="p-2.5 text-right text-sm tabular-nums text-muted-foreground">{Math.round(row.pct)}%</td>
        <td className="p-2.5 w-8">
          {row.id && (
            <button onClick={() => handleDeleteBudget(row.id!)} className="opacity-0 group-hover:opacity-100 rounded p-1 text-destructive hover:bg-destructive/10 transition-all">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </td>
      </tr>
    );
  };

  const renderSection = (label: string, headerColor: string, rows: SpreadsheetRow[], totalBudgeted: number, totalRealized: number, sectionType: string) => {
    const totalDiff = totalBudgeted - totalRealized;
    return (
      <div className="mb-6">
        <div className={cn("rounded-t-lg px-4 py-2.5 font-bold text-sm text-primary-foreground", headerColor)}>{label}</div>
        <div className="border border-t-0 rounded-b-lg overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-2.5 pl-3 text-left text-xs font-medium text-muted-foreground">Categoria</th>
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground w-28">Orçado</th>
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground w-28">Realizado</th>
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground w-28">Diferença</th>
                <th className="p-2.5 text-right text-xs font-medium text-muted-foreground w-16">%</th>
                <th className="p-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => renderRow(r, sectionType))}
              <tr className="border-t-2 border-border bg-muted/40 font-bold">
                <td className="p-2.5 pl-3 text-sm text-foreground">Total {label}</td>
                <td className="p-2.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(totalBudgeted, "BRL")}</td>
                <td className="p-2.5 text-right text-sm tabular-nums text-foreground">{formatCurrency(totalRealized, "BRL")}</td>
                <td className={cn("p-2.5 text-right text-sm tabular-nums", totalDiff >= 0 ? "text-income" : "text-destructive")}>
                  {totalDiff >= 0 ? "+" : ""}{formatCurrency(totalDiff, "BRL")}
                </td>
                <td className="p-2.5 text-right text-sm tabular-nums text-muted-foreground">{totalBudgeted > 0 ? `${Math.round((totalRealized / totalBudgeted) * 100)}%` : "—"}</td>
                <td className="p-2.5 w-8"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {monthOptions.map(m => <SelectItem key={m} value={m} className="capitalize">{getMonthLabel(m)}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto flex-wrap">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDuplicatePreviousMonth}><Copy className="h-3.5 w-3.5" /> Duplicar mês anterior</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV}><Download className="h-3.5 w-3.5" /> CSV</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportPDF}><FileText className="h-3.5 w-3.5" /> PDF</Button>
        </div>
      </div>
      {renderSection("ENTRADAS", "bg-[hsl(var(--income))]", incomeRows, totalIncomeBudgeted, totalIncomeRealized, "income")}
      {renderSection("SAÍDAS", "bg-[hsl(var(--expense))]", expenseRows, totalExpenseBudgeted, totalExpenseRealized, "expense")}
      {investmentRows.length > 0 && renderSection("APLICAÇÕES", "bg-primary", investmentRows, totalInvestBudgeted, totalInvestRealized, "investment")}
      <Card className="mt-2">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Saldo do mês</p>
              <p className={cn("text-2xl font-bold tabular-nums", saldoRealized >= 0 ? "text-income" : "text-destructive")}>
                {saldoRealized >= 0 ? "+" : ""}{formatCurrency(saldoRealized, "BRL")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Taxa de poupança</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={cn("text-xl font-bold tabular-nums", savingsRate >= 20 ? "text-income" : savingsRate >= 10 ? "text-amber-600" : "text-destructive")}>
                  {savingsRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
