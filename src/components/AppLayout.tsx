import { AppSidebar } from "@/components/AppSidebar";
import { QuickAddButton } from "@/components/QuickAddButton";
import { Outlet } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function AppLayout() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        {/* Mobile header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Menu className="h-5 w-5 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-60 bg-[hsl(var(--sidebar-background))] border-none">
              <VisuallyHidden><SheetTitle>Menu</SheetTitle></VisuallyHidden>
              <AppSidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="text-sm font-bold text-foreground">Fluxy</span>
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
