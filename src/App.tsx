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
import Transactions from "@/pages/Transactions";
import Categories from "@/pages/Categories";
import Rules from "@/pages/Rules";
import Contracts from "@/pages/Contracts";
import Connections from "@/pages/Connections";
import Budgets from "@/pages/Budgets";
import Auth from "@/pages/Auth";
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

            {/* Rotas protegidas */}
            <Route
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contas" element={<Accounts />} />
              <Route path="/movimentos" element={<Transactions />} />
              <Route path="/categorias" element={<Categories />} />
              <Route path="/orcamentos" element={<Budgets />} />
              <Route path="/regras" element={<Rules />} />
              <Route path="/contratos" element={<Contracts />} />
              <Route path="/conexoes" element={<Connections />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
