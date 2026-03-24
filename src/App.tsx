import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import { AppLayout } from "@/components/AppLayout";
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
import Auth from "@/pages/Auth";
import Plans from "@/pages/Plans";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/planos" element={<Plans />} />

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
              <Route path="/movimentos" element={<Transactions />} />
              <Route path="/movimentos" element={<Transactions />} />
              <Route path="/categorias" element={<Categories />} />
              <Route path="/orcamentos" element={<Budgets />} />
              <Route path="/simulador" element={<Simulator />} />
              <Route path="/projecao" element={<Projection />} />
              <Route path="/saude-financeira" element={<FinancialHealth />} />
              <Route path="/dicas" element={<FinancialTips />} />
              <Route path="/regras" element={<Rules />} />
              <Route path="/contratos" element={<Contracts />} />
              <Route path="/conexoes" element={<Connections />} />
              <Route path="/notificacoes" element={<Notifications />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
