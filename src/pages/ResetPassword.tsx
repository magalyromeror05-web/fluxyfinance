import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import fluxyLogo from "@/assets/fluxy-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type Status = "loading" | "ready" | "invalid" | "success";

function getPasswordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: "Fraca", color: "bg-destructive", pct: 25 };
  if (score === 2) return { label: "Regular", color: "bg-amber-500", pct: 50 };
  if (score === 3) return { label: "Forte", color: "bg-emerald-500", pct: 75 };
  return { label: "Muito forte", color: "bg-emerald-600", pct: 100 };
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validations = useMemo(() => ({
    minLength: password.length >= 8,
    hasNumber: /[0-9]/.test(password),
    matches: password.length > 0 && password === confirmPassword,
  }), [password, confirmPassword]);

  const canSubmit = validations.minLength && validations.hasNumber && validations.matches;

  useEffect(() => {
    // Check for recovery session from URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      // Supabase JS client auto-picks up the tokens from the hash
      supabase.auth.getSession().then(({ data: { session } }) => {
        setStatus(session ? "ready" : "invalid");
      });
      // Also listen for auth state change (token exchange may be async)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setStatus("ready");
        }
      });
      return () => subscription.unsubscribe();
    } else {
      // No hash — check if there's already a session (e.g. PKCE flow)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setStatus(session ? "ready" : "invalid");
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setStatus("ready");
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message.includes("same_password")
          ? "A nova senha deve ser diferente da atual."
          : "Erro ao atualizar a senha. Tente novamente.");
      } else {
        setStatus("success");
        toast({ title: "Senha atualizada com sucesso!" });
        setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex flex-col items-center gap-3">
            <img src={fluxyLogo} alt="Fluxy" className="h-14 w-auto" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Link inválido ou expirado</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Solicite um novo link de recuperação de senha.
            </p>
            <Button className="w-full" onClick={() => navigate("/auth", { replace: true })}>
              Solicitar novo link
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6 flex flex-col items-center gap-3">
            <img src={fluxyLogo} alt="Fluxy" className="h-14 w-auto" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Senha atualizada!</h2>
            <p className="text-sm text-muted-foreground">Redirecionando para o dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={fluxyLogo} alt="Fluxy" className="h-14 w-auto" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-1">Criar nova senha</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Escolha uma senha segura para sua conta.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{strength.label}</span>
                  </div>
                  <ul className="space-y-0.5 text-xs">
                    <li className={validations.minLength ? "text-emerald-600" : "text-muted-foreground"}>
                      {validations.minLength ? "✓" : "○"} Mínimo 8 caracteres
                    </li>
                    <li className={validations.hasNumber ? "text-emerald-600" : "text-muted-foreground"}>
                      {validations.hasNumber ? "✓" : "○"} Pelo menos 1 número
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && !validations.matches && (
                <p className="text-xs text-destructive">As senhas não coincidem.</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
