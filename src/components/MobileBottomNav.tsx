import { NavLink } from "@/components/NavLink";
import { BarChart3, CreditCard, LayoutDashboard, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const itemClass = "flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-muted-foreground transition-colors";
const activeClass = "text-primary";

export function MobileBottomNav() {
  const openQuickAdd = () => window.dispatchEvent(new CustomEvent("fluxy:quick-add", { detail: { type: "expense" } }));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-elevated backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center">
        <NavLink to="/dashboard" className={itemClass} activeClassName={activeClass}><LayoutDashboard className="h-5 w-5" /><span>Início</span></NavLink>
        <NavLink to="/movimentos" className={itemClass} activeClassName={activeClass}><BarChart3 className="h-5 w-5" /><span>Mov.</span></NavLink>
        <button onClick={openQuickAdd} className={cn(itemClass, "-mt-6 text-primary")} aria-label="Adicionar">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg"><Plus className="h-7 w-7" /></span>
          <span>Adicionar</span>
        </button>
        <NavLink to="/contas" className={itemClass} activeClassName={activeClass}><CreditCard className="h-5 w-5" /><span>Contas</span></NavLink>
        <NavLink to="/planos" className={itemClass} activeClassName={activeClass}><UserRound className="h-5 w-5" /><span>Perfil</span></NavLink>
      </div>
    </nav>
  );
}
