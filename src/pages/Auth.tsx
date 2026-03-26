import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Eye, EyeOff, MailCheck, ArrowLeft } from "lucide-react";
import fluxyLogo from "@/assets/fluxy-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emailService } from "@/lib/emailService";

type Mode = "login" | "signup" | "forgot" | "forgot-sent";

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  };

  const translateError = (msg: string) => {
    if (msg.includes("Invalid login credentials")) return "Email ou senha incorretos. Tente novamente.";
    if (msg.includes("already registered")) return "Este email já está cadastrado. Faça login.";
    if (msg.includes("Password should be at least")) return "A senha deve ter pelo menos 6 caracteres.";
    if (msg.includes("Email not confirmed")) return "Confirme seu email antes de fazer login. Verifique sua caixa de entrada.";
    return "Algo deu errado. Tente novamente.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (!fullName.trim()) { setError("Informe seu nome completo."); return; }
      if (password.length < 6) { setError("A senha precisa ter pelo menos 6 caracteres."); return; }
      if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) setError(translateError(error.message));
      } else if (mode === "signup") {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(translateError(error.message));
        } else {
          // Fire-and-forget welcome email (user may not be confirmed yet, but log the intent)
          emailService.sendWelcome(email, fullName, "").catch(() => {});
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Informe seu email."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/auth/reset-password",
      });
      if (error) {
        setError(translateError(error.message));
      } else {
        setMode("forgot-sent");
      }
    } finally {
      setLoading(false);
    }
  };

  // Forgot password - email sent confirmation
  if (mode === "forgot-sent") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <img src={fluxyLogo} alt="Fluxy" className="h-14 w-auto" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MailCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">Email enviado!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Enviamos um link de recuperação para <strong className="text-foreground">{email}</strong>. Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <Button className="w-full" onClick={() => switchMode("login")}>
              Voltar para o login
            </Button>
            <p className="mt-4 text-xs text-muted-foreground">
              Não recebeu? Aguarde alguns minutos ou verifique a pasta de spam.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password form
  if (mode === "forgot") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center gap-3">
            <img src={fluxyLogo} alt="Fluxy" className="h-14 w-auto" />
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-1">Recuperar senha</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="voce@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </Button>
            </form>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mx-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Login / Signup form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src={fluxyLogo} alt="Fluxy" className="h-14 w-auto" />
          <div className="text-center">
            <p className="text-xl font-bold tracking-tight text-foreground">Fluxy</p>
            <p className="text-xs text-muted-foreground">Suas finanças, cada moeda no seu lugar</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-medium text-muted-foreground">Nome completo</Label>
                <Input id="fullName" type="text" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input id="email" type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Senha</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "Mínimo 6 caracteres" : "Sua senha"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <>Não tem conta?{" "}<button type="button" onClick={() => switchMode("signup")} className="text-primary hover:underline">Criar agora</button></>
          ) : (
            <>Já tem conta?{" "}<button type="button" onClick={() => switchMode("login")} className="text-primary hover:underline">Fazer login</button></>
          )}
        </p>
      </div>
    </div>
  );
}
