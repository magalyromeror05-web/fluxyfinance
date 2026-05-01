import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import fluxyLogo from "@/assets/fluxy-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const accountTypes = [
  { value: "checking", labelKey: "onboarding.accountTypes.checking" },
  { value: "savings", labelKey: "onboarding.accountTypes.savings" },
  { value: "wallet", labelKey: "onboarding.accountTypes.wallet" },
  { value: "investment", labelKey: "onboarding.accountTypes.investment" },
  { value: "credit", labelKey: "onboarding.accountTypes.credit" },
];

const currencies = [
  { value: "BRL", label: "BRL — Real Brasileiro", flag: "🇧🇷" },
  { value: "USD", label: "USD — Dólar Americano", flag: "🇺🇸" },
  { value: "EUR", label: "EUR — Euro", flag: "🇪🇺" },
  { value: "GBP", label: "GBP — Libra Esterlina", flag: "🇬🇧" },
  { value: "PYG", label: "PYG — Guarani", flag: "🇵🇾" },
  { value: "ARS", label: "ARS — Peso Argentino", flag: "🇦🇷" },
];

export default function Onboarding() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [accountAdded, setAccountAdded] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.full_name || ""
  );

  // Step 2
  const [form, setForm] = useState({
    institution_name: "",
    account_name: "",
    type: "checking",
    currency: "BRL",
    balance: "",
  });

  const handleStep1 = async () => {
    if (!displayName.trim()) {
      toast.error(t("onboarding.nameRequired"));
      return;
    }
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ full_name: displayName.trim() })
      .eq("id", user!.id);
    setSaving(false);
    setStep(2);
  };

  const handleAddAccount = async () => {
    if (!form.institution_name.trim() || !form.account_name.trim()) {
      toast.error(t("onboarding.requiredFields"));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("accounts").insert({
      user_id: user!.id,
      institution_name: form.institution_name.trim(),
      account_name: form.account_name.trim(),
      type: form.type,
      currency: form.currency,
      balance: parseFloat(form.balance) || 0,
    });
    setSaving(false);
    if (error) {
      toast.error(t("onboarding.createAccountError", { message: error.message }));
      return;
    }
    setAccountAdded(true);
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    setStep(3);
  };

  const handleFinish = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: true } as any)
      .eq("id", user!.id);

    if (error) {
      toast.error(t("onboarding.finishError") || "Erro ao finalizar. Tente novamente.");
      setSaving(false);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await queryClient.refetchQueries({ queryKey: ["profile"] });
    setSaving(false);
    navigate("/dashboard", { replace: true });
  };

  // SQL fix for users affected by the previous bug (run manually in SQL Editor):
  // UPDATE profiles SET onboarding_completed = true WHERE onboarding_completed IS NULL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-elevated w-full max-w-md overflow-hidden fade-in relative">
        <div className="absolute right-4 top-4 z-10">
          <LanguageSelector />
        </div>
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                s === step
                  ? "w-8 bg-primary"
                  : s < step
                  ? "w-2 bg-primary/40"
                  : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-8 pt-4">
          {/* ─── STEP 1 ─── */}
          {step === 1 && (
            <div className="text-center space-y-6 fade-in">
              <img
                src={fluxyLogo}
                alt="Fluxy"
                className="h-14 w-14 mx-auto rounded-xl"
              />
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t("onboarding.step1Title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("onboarding.step1Subtitle")}
                </p>
              </div>
              <div className="text-left">
                <Label>{t("onboarding.nameLabel")}</Label>
                <Input
                  placeholder={t("onboarding.namePlaceholder")}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                />
              </div>
              <Button
                onClick={handleStep1}
                disabled={saving}
                className="w-full"
              >
                {saving ? t("common.saving") : t("common.continue")}
              </Button>
            </div>
          )}

          {/* ─── STEP 2 ─── */}
          {step === 2 && (
            <div className="space-y-5 fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">
                  {t("onboarding.step2Title")}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("onboarding.step2Subtitle")}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>{t("onboarding.institutionLabel")}</Label>
                  <Input
                    placeholder={t("onboarding.institutionPlaceholder")}
                    value={form.institution_name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        institution_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>{t("onboarding.accountNameLabel")}</Label>
                  <Input
                    placeholder={t("onboarding.accountNamePlaceholder")}
                    value={form.account_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, account_name: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("onboarding.typeLabel")}</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, type: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[9999]">
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {t(type.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("onboarding.currencyLabel")}</Label>
                    <Select
                      value={form.currency}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, currency: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[9999]">
                        {currencies.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.flag} {c.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>{t("onboarding.balanceLabel")}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.balance}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, balance: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleAddAccount}
                disabled={saving}
                className="w-full"
              >
                {saving ? t("onboarding.adding") : t("onboarding.addAccount")}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(3)}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                {t("onboarding.skip")}
              </Button>
            </div>
          )}

          {/* ─── STEP 3 ─── */}
          {step === 3 && (
            <div className="text-center space-y-6 fade-in">
              {/* Animated checkmark */}
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary onboarding-check"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 13l4 4L19 7" className="onboarding-check-path" />
                </svg>
              </div>

              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {t("onboarding.doneTitle")}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                  {accountAdded
                    ? t("onboarding.doneWithAccount")
                    : t("onboarding.doneWithoutAccount")}
                </p>
              </div>

              <Button
                onClick={handleFinish}
                disabled={saving}
                className="w-full"
              >
                {saving ? t("onboarding.finishing") : t("onboarding.finish")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .onboarding-check-path {
          stroke-dasharray: 24;
          stroke-dashoffset: 24;
          animation: checkDraw 0.5s ease 0.3s forwards;
        }
        @keyframes checkDraw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
