import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Tags,
  Sliders,
  FileText,
  Plug2,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Contas", href: "/contas", icon: CreditCard },
  { label: "Movimentos", href: "/movimentos", icon: ArrowLeftRight },
  { label: "Categorias", href: "/categorias", icon: Tags },
  { label: "Regras", href: "/regras", icon: Sliders },
  { label: "Contratos", href: "/contratos", icon: FileText },
  { label: "Conexões", href: "/conexoes", icon: Plug2 },
];

export function AppSidebar() {
  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col bg-[hsl(var(--sidebar-background))]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-primary))]">
          <Globe className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white tracking-tight">AtlasCash</p>
          <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-60">Multi-moeda</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
      {navItems.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            end={href === "/"}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white"
            activeClassName="bg-[hsl(var(--sidebar-accent))] text-white"
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-full bg-[hsl(var(--sidebar-accent))] flex items-center justify-center text-xs font-bold text-white">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">João Demo</p>
            <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-60 truncate">joao@email.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
