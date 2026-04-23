import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { AdminGuard } from "@/components/AdminGuard";
import { AppLayout } from "@/components/AppLayout";
import { AdminLayout } from "@/components/AdminLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import Investments from "@/pages/Investments";
import Transactions from "@/pages/Transactions";
import Categories from "@/pages/Categories";
import Rules from "@/pages/Rules";
import Contracts from "@/pages/Contracts";
import Connections from "@/pages/Connections";
import Budgets from "@/pages/Budgets";
import Simulator from "@/pages/Simulator";
import Projection from "@/pages/Projection";
import FinancialHealth from "@/pages/FinancialHealth";
import FinancialTips from "@/pages/FinancialTips";
import Notifications from "@/pages/Notifications";
import Goals from "@/pages/Goals";
import Reports from "@/pages/Reports";
import Converter from "@/pages/Converter";
import Extratos from "@/pages/Extratos";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import Plans from "@/pages/Plans";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminEmails from "@/pages/admin/AdminEmails";
import AdminSupport from "@/pages/admin/AdminSupport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route path="/planos" element={<Plans />} />
              <Route path="/conversor" element={<Converter />} />

              {/* Rotas protegidas */}
              <Route
                element={
                  <AuthGuard>
                    <OnboardingGuard>
                      <AppLayout />
                    </OnboardingGuard>
                  </AuthGuard>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/contas" element={<Accounts />} />
                <Route path="/investimentos" element={<Investments />} />
                <Route path="/metas" element={<Goals />} />
                <Route path="/movimentos" element={<Transactions />} />
                <Route path="/categorias" element={<Categories />} />
                <Route path="/orcamentos" element={<Budgets />} />
                <Route path="/simulador" element={<Simulator />} />
                <Route path="/projecao" element={<Projection />} />
                <Route path="/saude-financeira" element={<FinancialHealth />} />
                <Route path="/dicas" element={<FinancialTips />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/extratos" element={<Extratos />} />
                <Route path="/regras" element={<Rules />} />
                <Route path="/contratos" element={<Contracts />} />
                <Route path="/conexoes" element={<Connections />} />
                <Route path="/notificacoes" element={<Notifications />} />
              </Route>

              {/* Rotas admin */}
              <Route
                element={
                  <AuthGuard>
                    <AdminGuard>
                      <AdminLayout />
                    </AdminGuard>
                  </AuthGuard>
                }
              >
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/usuarios" element={<AdminUsers />} />
                <Route path="/admin/logs" element={<AdminLogs />} />
                <Route path="/admin/emails" element={<AdminEmails />} />
                <Route path="/admin/suporte" element={<AdminSupport />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
