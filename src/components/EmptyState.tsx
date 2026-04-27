import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  subtitle,
  actionLabel,
  onAction,
  className,
}: {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("atlas-card p-10 text-center fade-in", className)}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl text-primary">
        {Icon ? <Icon className="h-8 w-8" /> : emoji}
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{subtitle}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
