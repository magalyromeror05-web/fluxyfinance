import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Tags,
  Sliders,
  FileText,
  Plug2,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import fluxyLogo from "@/assets/fluxy-logo.png";

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
  const { user, signOut } = useAuth();

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col bg-[hsl(var(--sidebar-background))]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[hsl(var(--sidebar-border))]">
        <img src={fluxyLogo} alt="Fluxy" className="h-8 w-8 rounded-lg object-contain" />
        <div>
          <p className="text-sm font-bold text-white tracking-tight">Fluxy</p>
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
          <div className="h-7 w-7 rounded-full bg-[hsl(var(--sidebar-accent))] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{fullName}</p>
            <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-60 truncate">{email}</p>
          </div>
          <button
            onClick={signOut}
            title="Sair"
            className="flex-shrink-0 rounded-md p-1.5 text-[hsl(var(--sidebar-foreground))] opacity-60 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
