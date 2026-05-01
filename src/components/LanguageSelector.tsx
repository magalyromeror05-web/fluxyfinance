import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Languages } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import i18nInstance, { getSupportedLanguage, languageOptions, type SupportedLanguage } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LanguageSelectorProps = {
  compact?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
  variant?: "dropdown" | "inline";
};

export function LanguageSelector({
  compact = false,
  className,
  align = "end",
  variant = "dropdown",
}: LanguageSelectorProps) {
  const { user } = useAuth();
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const currentLanguage = getSupportedLanguage(i18n.language);

  const { data: profileLanguage } = useQuery({
    queryKey: ["profile-language", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return getSupportedLanguage((data as any)?.language);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (profileLanguage && profileLanguage !== currentLanguage) {
      i18n.changeLanguage(profileLanguage);
    }
  }, [currentLanguage, i18n, profileLanguage]);

  const changeLanguage = async (language: SupportedLanguage) => {
    await i18nInstance.changeLanguage(language);
    localStorage.setItem("fluxy-language", language);
    localStorage.setItem("i18nextLng", language);

    if (user?.id) {
      await supabase
        .from("profiles")
        .update({ language } as any)
        .eq("id", user.id);
      queryClient.setQueryData(["profile-language", user.id], language);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    }
  };

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex h-8 items-center gap-1 rounded-lg bg-[hsl(var(--sidebar-accent))]/30 p-1",
          className,
        )}
      >
        {languageOptions.map((option) => {
          const active = option.code === currentLanguage;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => changeLanguage(option.code)}
              title={option.label}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold transition-colors",
                active
                  ? "bg-[hsl(var(--sidebar-accent))] text-white shadow-sm"
                  : "text-[hsl(var(--sidebar-foreground))] opacity-60 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))]/50",
              )}
            >
              <span className="text-xs leading-none">{option.flag}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const selected = languageOptions.find((option) => option.code === currentLanguage) ?? languageOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={t("language.label")}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted",
            compact && "border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent))] text-white shadow-none hover:bg-[hsl(var(--sidebar-accent))]/80",
            className,
          )}
        >
          {compact ? <Languages className="h-3.5 w-3.5" /> : <span>{selected.flag}</span>}
          <span>{selected.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-[8rem]">
        {languageOptions.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onClick={() => changeLanguage(option.code)}
            className="flex cursor-pointer items-center gap-2"
          >
            <span>{option.flag}</span>
            <span className="font-medium">{option.label}</span>
            {option.code === currentLanguage && <Check className="ml-auto h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

