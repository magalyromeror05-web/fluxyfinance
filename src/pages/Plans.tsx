import { useState } from "react";
import { useNavigate } from "react-router-dom";
import fluxyLogo from "@/assets/fluxy-logo.png";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Free",
    price: { monthly: "0", annual: "0" },
    desc: "Para começar a organizar suas finanças.",
    cta: "Começar grátis",
    featured: false,
    features: [
      "2 moedas",
      "3 contas bancárias",
      "Categorização manual",
      "Orçamentos básicos",
      "30 dias de histórico",
    ],
  },
  {
    name: "Pro",
    price: { monthly: "29,90", annual: "251" },
    desc: "Para quem quer controle total.",
    cta: "Assinar Pro",
    featured: true,
    features: [
      "Moedas ilimitadas",
      "Contas ilimitadas",
      "Open Finance sync",
      "Categorização por IA",
      "Orçamentos avançados",
      "Projeção de 5 anos",
      "Dicas financeiras personalizadas",
      "Regras & automações",
      "Exportação CSV/PDF",
    ],
  },
  {
    name: "Pro Anual",
    price: { monthly: "20,90", annual: "251" },
    desc: "Tudo do Pro com desconto anual.",
    cta: "Assinar Pro Anual",
    featured: false,
    features: [
      "Tudo do plano Pro",
      "30% de desconto",
      "Suporte prioritário",
      "Acesso antecipado a novidades",
    ],
  },
];

export default function Plans() {
  const [annual, setAnnual] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ email: email.trim(), plan: selectedPlan });
      if (error) throw error;
      toast({ title: "Cadastro realizado!", description: "Avisaremos quando os pagamentos estiverem disponíveis." });
      setEmail("");
    } catch {
      toast({ title: "Erro", description: "Não foi possível cadastrar. Tente novamente.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2.5">
          <img src={fluxyLogo} alt="Fluxy" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-extrabold text-lg tracking-tight text-[#1e1b4b]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Fluxy
          </span>
        </button>
        <h1 className="text-lg font-bold text-[#1e1b4b]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Escolha seu plano
        </h1>
      </header>

      {/* Pricing */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e1b4b] mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Planos simples e transparentes
          </h2>
          <p className="text-[#1e1b4b]/50 mb-6">Comece grátis, evolua quando precisar.</p>
          <div className="inline-flex items-center gap-3 bg-white rounded-full border border-[hsl(262_40%_90%)] p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm font-medium rounded-full px-4 py-1.5 transition-colors ${!annual ? "bg-[hsl(var(--primary))] text-white" : "text-[#1e1b4b]/60"}`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-sm font-medium rounded-full px-4 py-1.5 transition-colors ${annual ? "bg-[hsl(var(--primary))] text-white" : "text-[#1e1b4b]/60"}`}
            >
              Anual
            </button>
            {annual && (
              <span className="text-[10px] font-bold text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)] rounded-full px-2 py-0.5">
                Economize 30%
              </span>
            )}
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const price = annual ? plan.price.annual : plan.price.monthly;
            const suffix = annual ? "/ano" : "/mês";
            return (
              <div
                key={i}
                className={`relative rounded-2xl p-6 bg-white transition-all hover:-translate-y-1 hover:shadow-xl ${
                  plan.featured ? "border-2 border-[hsl(var(--primary))] shadow-lg" : "border border-[hsl(262_40%_92%)]"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-[hsl(var(--primary))] rounded-full px-3 py-0.5">
                    Mais popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-[#1e1b4b] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {plan.name}
                </h3>
                <p className="text-sm text-[#1e1b4b]/50 mb-4">{plan.desc}</p>
                <div className="mb-5">
                  <span className="text-4xl font-extrabold text-[#1e1b4b]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {price === "0" ? "R$ 0" : `R$ ${price}`}
                  </span>
                  <span className="text-sm text-[#1e1b4b]/40 ml-1">{price !== "0" ? suffix : ""}</span>
                </div>
                <a
                  href="/auth"
                  className={`block text-center text-sm font-semibold rounded-xl py-3 mb-6 transition-all hover:-translate-y-0.5 ${
                    plan.featured
                      ? "text-white hover:shadow-lg"
                      : "text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.3)] hover:border-[hsl(var(--primary))]"
                  }`}
                  style={plan.featured ? { background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" } : {}}
                >
                  {plan.cta}
                </a>
                <ul className="space-y-2.5">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-[#1e1b4b]/70">
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-[hsl(var(--primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Waitlist */}
      <section className="py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-sm text-[#1e1b4b]/50 mb-4">
            Pagamentos serão habilitados em breve. Cadastre seu interesse.
          </p>
          <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground"
              >
                <option value="pro">Pro</option>
                <option value="pro_annual">Pro Anual</option>
              </select>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-56 bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))" }}
            >
              {submitting ? "Enviando..." : "Me avise quando estiver disponível"}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 text-center">
        <p className="text-xs text-[#1e1b4b]/30">© {new Date().getFullYear()} Fluxy</p>
      </footer>
    </div>
  );
}
