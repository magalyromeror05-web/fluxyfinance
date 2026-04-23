import { useEffect, useRef, useCallback } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";

const STEPS = [
  {
    element: '[data-tour="nav-dashboard"]',
    popover: {
      title: "📊 Dashboard",
      description:
        "Aqui você tem uma visão completa das suas finanças: saldo total, entradas, saídas e gráficos do mês.",
    },
  },
  {
    element: '[data-tour="nav-contas"]',
    popover: {
      title: "💳 Contas",
      description:
        "Gerencie todas as suas contas bancárias, carteiras digitais e cartões em um só lugar.",
    },
  },
  {
    element: '[data-tour="nav-movimentos"]',
    popover: {
      title: "🔁 Movimentos",
      description:
        "Registre entradas e saídas manualmente ou importe extratos bancários.",
    },
  },
  {
    element: '[data-tour="nav-orcamentos"]',
    popover: {
      title: "🥧 Orçamentos",
      description:
        "Defina limites de gastos por categoria e acompanhe se está dentro do planejado.",
    },
  },
  {
    element: '[data-tour="nav-metas"]',
    popover: {
      title: "🎯 Metas",
      description:
        "Crie objetivos financeiros e veja seu progresso mês a mês.",
    },
  },
  {
    element: '[data-tour="nav-relatorios"]',
    popover: {
      title: "📈 Relatórios",
      description:
        "Visualize gráficos detalhados de como você está usando seu dinheiro.",
    },
  },
  {
    element: '[data-tour="nav-saude"]',
    popover: {
      title: "❤️ Saúde Financeira",
      description:
        "Receba um diagnóstico completo e dicas personalizadas para melhorar suas finanças.",
    },
  },
  {
    popover: {
      title: "🎉 Tudo pronto!",
      description:
        "Você já conhece o Fluxy. Comece adicionando uma conta ou registrando seu primeiro movimento. Bons trilhos!",
    },
  },
];

function buildDriver(onDone: () => void): Driver {
  return driver({
    showProgress: true,
    allowClose: true,
    overlayOpacity: 0.6,
    nextBtnText: "Próximo →",
    prevBtnText: "← Voltar",
    doneBtnText: "Começar a usar o Fluxy",
    progressText: "{{current}} de {{total}}",
    steps: STEPS,
    onDestroyed: () => onDone(),
  });
}

export function useWelcomeTour() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const driverRef = useRef<Driver | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile-tour", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed, tour_completed")
        .eq("id", user.id)
        .maybeSingle();
      return data as { onboarding_completed: boolean; tour_completed: boolean } | null;
    },
    enabled: !!user?.id,
  });

  const markCompleted = useCallback(async () => {
    if (!user?.id) return;
    await supabase
      .from("profiles")
      .update({ tour_completed: true } as any)
      .eq("id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile-tour", user.id] });
  }, [user?.id, queryClient]);

  const startTour = useCallback(() => {
    if (driverRef.current) {
      try { driverRef.current.destroy(); } catch {}
    }
    const d = buildDriver(() => {
      markCompleted();
    });
    driverRef.current = d;
    // Small delay to ensure DOM is ready
    setTimeout(() => d.drive(), 200);
  }, [markCompleted]);

  // Auto-start the tour for users who completed onboarding but never saw the tour
  useEffect(() => {
    if (!profile) return;
    if (profile.onboarding_completed && !profile.tour_completed) {
      startTour();
    }
    return () => {
      if (driverRef.current) {
        try { driverRef.current.destroy(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.onboarding_completed, profile?.tour_completed]);

  return { startTour, tourCompleted: profile?.tour_completed ?? false };
}

export function TourHelpButton() {
  const { startTour } = useWelcomeTour();
  return (
    <button
      onClick={startTour}
      title="Ver tour novamente"
      aria-label="Ver tour novamente"
      className="fixed bottom-6 left-6 z-40 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 hover:shadow-xl transition-all flex items-center justify-center"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}

// Tiny wrapper used at Dashboard level to ensure the auto-start hook runs
export function WelcomeTourMount() {
  useWelcomeTour();
  return null;
}
