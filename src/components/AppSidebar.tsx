import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  Repeat,
  Landmark,
  Target,
  Tags,
  Sliders,
  FileText,
  BarChart3,
  Plug2,
  LogOut,
  Calculator,
  TrendingUp,
  Heart,
  Star,
  BookOpen,
  PieChart,
  Settings,
  FileSpreadsheet,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useTranslation } from "react-i18next";
import fluxyLogo from "@/assets/fluxy-logo.png";
import { Separator } from "@/components/ui/separator";
import { LanguageSelector } from "@/components/LanguageSelector";

const navGroups = [
  { label: "VISÃO GERAL", items: [
    { labelKey: "sidebar.dashboard", href: "/dashboard", icon: LayoutDashboard, tour: "dashboard" },
    { labelKey: "sidebar.accounts", href: "/contas", icon: CreditCard, tour: "contas" },
    { labelKey: "sidebar.investments", href: "/investimentos", icon: Landmark },
  ]},
  { label: "MOVIMENTOS", items: [
    { labelKey: "sidebar.transactions", href: "/movimentos", icon: ArrowLeftRight, tour: "movimentos" },
    { labelKey: "sidebar.categories", href: "/categorias", icon: Tags },
    { labelKey: "sidebar.rules", href: "/regras", icon: Sliders },
  ]},
  { label: "PLANEJAMENTO", items: [
    { labelKey: "sidebar.budgets", href: "/orcamentos", icon: PieChart, tour: "orcamentos" },
    { labelKey: "sidebar.goals", href: "/metas", icon: Target, tour: "metas" },
    { labelKey: "sidebar.contracts", href: "/contratos", icon: FileText },
  ]},
  { label: "ANÁLISE", items: [
    { labelKey: "sidebar.reports", href: "/relatorios", icon: BarChart3, tour: "relatorios" },
    { labelKey: "sidebar.health", href: "/saude-financeira", icon: Heart, tour: "saude" },
    { labelKey: "sidebar.projection", href: "/projecao", icon: TrendingUp },
    { labelKey: "sidebar.simulator", href: "/simulador", icon: Calculator },
  ]},
  { label: "FERRAMENTAS", items: [
    { labelKey: "sidebar.statements", href: "/extratos", icon: Activity },
    { labelKey: "sidebar.converter", href: "/conversor", icon: Repeat },
    { labelKey: "sidebar.connections", href: "/conexoes", icon: Plug2 },
    { labelKey: "sidebar.tips", href: "/dicas", icon: BookOpen },
  ]},
];

export function AppSidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useTranslation();

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  const linkClass =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-white";
  const activeClass = "bg-[hsl(var(--sidebar-accent))] text-white";

  return (
    <aside className="flex h-screen w-60 flex-shrink-0 flex-col bg-[hsl(var(--sidebar-background))]">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-[hsl(var(--sidebar-border))] space-y-3">
        <div className="flex items-center gap-3">
          <img src={fluxyLogo} alt="Fluxy" className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold text-white tracking-tight">Fluxy</p>
            <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-60">{t("sidebar.tagline")}</p>
          </div>
        </div>
        <LanguageSelector variant="inline" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label} className="space-y-1.5">
            {groupIndex > 0 && <Separator className="!my-2 bg-[hsl(var(--sidebar-border))]" />}
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[hsl(var(--sidebar-foreground))] opacity-45">{group.label}</p>
            {group.items.map(({ labelKey, href, icon: Icon, tour }) => (
              <NavLink key={href} to={href} end={href === "/"} onClick={onNavigate} className={linkClass} activeClassName={activeClass} data-tour={tour ? `nav-${tour}` : undefined}>
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{t(labelKey)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[hsl(var(--sidebar-border))] space-y-3">
        {/* Admin link */}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[hsl(var(--sidebar-foreground))] opacity-60 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>{t("sidebar.admin")}</span>
          </NavLink>
        )}

        {/* Upgrade button */}
        <NavLink
          to="/planos"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, hsl(var(--sidebar-primary)), hsl(var(--accent)))" }}
        >
          <Star className="h-4 w-4 fill-current" />
          <span>{t("sidebar.upgrade")}</span>
        </NavLink>

        {/* User info */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-[hsl(var(--sidebar-accent))] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{fullName}</p>
            <p className="text-[10px] text-[hsl(var(--sidebar-foreground))] opacity-60 truncate">{email}</p>
          </div>
          <button
            onClick={signOut}
            title={t("common.logout")}
            className="flex-shrink-0 rounded-md p-1.5 text-[hsl(var(--sidebar-foreground))] opacity-60 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
