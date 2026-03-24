import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import fluxyLogo from "@/assets/fluxy-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const accountTypes = [
  { value: "checking", label: "Conta Corrente" },
  { value: "savings", label: "Poupança" },
  { value: "wallet", label: "Carteira Digital" },
  { value: "investment", label: "Investimento" },
  { value: "credit", label: "Crédito" },
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
      toast.error("Informe seu nome.");
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
      toast.error("Preencha todos os campos obrigatórios.");
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
      toast.error("Erro ao criar conta: " + error.message);
      return;
    }
    setAccountAdded(true);
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
    setStep(3);
  };

  const handleFinish = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ onboarding_completed: true } as any)
      .eq("id", user!.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    setSaving(false);
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-elevated w-full max-w-md overflow-hidden fade-in">
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
                  Bem-vindo ao Fluxy 👋
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Finanças inteligentes, para quem vive no mundo real.
                </p>
              </div>
              <div className="text-left">
                <Label>Como podemos te chamar?</Label>
                <Input
                  placeholder="Seu nome"
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
                {saving ? "Salvando..." : "Continuar"}
              </Button>
            </div>
          )}

          {/* ─── STEP 2 ─── */}
          {step === 2 && (
            <div className="space-y-5 fade-in">
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground">
                  Vamos adicionar sua primeira conta
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Cadastre uma conta bancária ou carteira digital.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Nome da instituição</Label>
                  <Input
                    placeholder="Ex: Nubank, Itaú, Wise"
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
                  <Label>Nome da conta</Label>
                  <Input
                    placeholder="Ex: Conta Corrente, Poupança"
                    value={form.account_name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, account_name: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, type: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accountTypes.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Moeda</Label>
                    <Select
                      value={form.currency}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, currency: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
                  <Label>Saldo atual</Label>
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
                {saving ? "Adicionando..." : "Adicionar conta"}
              </Button>

              <button
                onClick={() => {
                  setStep(3);
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Pular por agora
              </button>
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
                  Tudo pronto!
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                  {accountAdded
                    ? "Sua primeira conta foi adicionada. Agora você tem uma visão clara das suas finanças."
                    : "Você pode adicionar contas a qualquer momento na seção Contas."}
                </p>
              </div>

              <Button
                onClick={handleFinish}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Finalizando..." : "Ir para o dashboard"}
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
