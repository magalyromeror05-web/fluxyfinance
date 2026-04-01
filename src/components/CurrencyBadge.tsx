import { cn } from "@/lib/utils";
import type { Currency } from "@/types/database";
import { CURRENCY_LABELS } from "@/types/database";

const colorMap: Record<string, string> = {
  BRL: "badge-brl",
  USD: "badge-usd",
  PYG: "badge-pyg",
};

export function CurrencyBadge({ currency, size = "md", className }: CurrencyBadgeProps) {
  const { flag, symbol } = CURRENCY_LABELS[currency];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold tracking-wide",
        colorMap[currency],
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <span>{flag}</span>
      <span>{currency}</span>
    </span>
  );
}
