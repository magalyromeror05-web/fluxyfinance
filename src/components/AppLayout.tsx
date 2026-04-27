import { AppSidebar } from "@/components/AppSidebar";
import { QuickAddButton } from "@/components/QuickAddButton";
import { NotificationCenter } from "@/components/NotificationCenter";
import { CurrencyConverterPopover } from "@/components/CurrencyConverter";
import { TourHelpButton } from "@/components/WelcomeTour";
import { SupportChat } from "@/components/SupportChat";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { runAllNotificationChecks } from "@/lib/notificationService";

export function AppLayout() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      runAllNotificationChecks(user.id);
    }
  }, [user?.id]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden md:flex">
        <AppSidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-end px-6 py-3 border-b border-border bg-card flex-shrink-0">
          <CurrencyConverterPopover />
          <NotificationCenter />
        </header>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          <Outlet />
        </main>
      </div>
      <QuickAddButton />
      <MobileBottomNav />
      <TourHelpButton />
      <SupportChat />
    </div>
  );
}
