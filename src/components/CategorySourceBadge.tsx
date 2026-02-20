import { cn } from "@/lib/utils";
import type { CategorySource } from "@/data/mockData";

const sourceConfig: Record<CategorySource, { label: string; className: string }> = {
  provider: { label: "Banco", className: "bg-blue-50 text-blue-700 border-blue-200" },
  rule:     { label: "Regra", className: "bg-violet-50 text-violet-700 border-violet-200" },
  ai:       { label: "IA", className: "bg-amber-50 text-amber-700 border-amber-200" },
  manual:   { label: "Manual", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export function CategorySourceBadge({ source }: { source: CategorySource }) {
  const { label, className } = sourceConfig[source];
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}
