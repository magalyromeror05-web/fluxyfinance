import { NavLink } from "@/components/NavLink";
import { Outlet, useNavigate } from "react-router-dom";
import { BarChart3, Users, AlertTriangle, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import fluxyLogo from "@/assets/fluxy-logo.png";
import { Separator } from "@/components/ui/separator";

const adminItems = [
  { label: "Visão geral", href: "/admin", icon: BarChart3 },
  { label: "Usuários", href: "/admin/usuarios", icon: Users },
  { label: "Logs de erro", href: "/admin/logs", icon: AlertTriangle },
  { label: "Emails", href: "/admin/emails", icon: Mail },
];

export function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const email = user?.email ?? "";

  const linkClass =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-foreground";
  const activeClass = "bg-accent text-foreground";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="flex h-screen w-60 flex-shrink-0 flex-col bg-muted/50 border-r border-border">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-border">
          <img src={fluxyLogo} alt="Fluxy" className="h-8 w-8 rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold text-foreground tracking-tight">Fluxy</p>
            <p className="text-[10px] text-muted-foreground">Painel Admin</p>
          </div>
          <span className="ml-auto rounded-md bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {adminItems.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/admin"}
              className={linkClass}
              activeClassName={activeClass}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <Separator className="bg-border" />

        {/* Footer */}
        <div className="px-4 py-4 space-y-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao app
          </button>
          <p className="text-[10px] text-muted-foreground truncate px-3">{email}</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
