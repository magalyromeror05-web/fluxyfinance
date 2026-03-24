import { useState } from "react";
import fluxyLogo from "@/assets/fluxy-logo.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Lang = "pt" | "en" | "es";

const t = {
  nav: {
    features: { pt: "Funcionalidades", en: "Features", es: "Funcionalidades" },
    plans: { pt: "Planos", en: "Plans", es: "Planes" },
    faq: { pt: "FAQ", en: "FAQ", es: "FAQ" },
    login: { pt: "Entrar", en: "Login", es: "Iniciar sesión" },
    cta: { pt: "Começar grátis", en: "Get started free", es: "Empezar gratis" },
  },
  hero: {
    badge: {
      pt: "Multimoeda · Open Finance · IA Financeira",
      en: "Multicurrency · Open Finance · Financial AI",
      es: "Multimoneda · Open Finance · IA Financiera",
    },
    heading1: {
      pt: "Finanças inteligentes,",
      en: "Smart finances,",
      es: "Finanzas inteligentes,",
    },
    heading2: {
      pt: "para quem vive no mundo real.",
      en: "for those living in the real world.",
      es: "para quienes viven en el mundo real.",
    },
    subtitle: {
      pt: "Controle multimoeda, orçamentos inteligentes e projeções financeiras com inteligência artificial. Tudo em um só lugar.",
      en: "Multicurrency control, smart budgets and financial projections with artificial intelligence. All in one place.",
      es: "Control multimoneda, presupuestos inteligentes y proyecciones financieras con inteligencia artificial. Todo en un solo lugar.",
    },
    cta: { pt: "Começar gratuitamente", en: "Start for free", es: "Empezar gratis" },
    demo: { pt: "Ver demonstração", en: "See demo", es: "Ver demostración" },
  },
  stats: {
    items: [
      { value: "12+", label: { pt: "Moedas suportadas", en: "Supported currencies", es: "Monedas soportadas" } },
      { value: "Open", label: { pt: "Finance integrado", en: "Finance integrated", es: "Finance integrado" } },
      { value: "5", label: { pt: "Anos de projeção financeira", en: "Years of financial projection", es: "Años de proyección financiera" } },
      { value: "100%", label: { pt: "Seus dados, seu controle", en: "Your data, your control", es: "Tus datos, tu control" } },
    ],
  },
  features: {
    title: { pt: "Tudo que você precisa para organizar suas finanças", en: "Everything you need to organize your finances", es: "Todo lo que necesitas para organizar tus finanzas" },
    subtitle: { pt: "Ferramentas poderosas, interface simples.", en: "Powerful tools, simple interface.", es: "Herramientas poderosas, interfaz simple." },
    items: [
      { icon: "💱", title: { pt: "Multimoeda nativo", en: "Native multicurrency", es: "Multimoneda nativo" }, desc: { pt: "Gerencie contas em BRL, USD, EUR, PYG e mais. Conversão automática e visão consolidada.", en: "Manage accounts in BRL, USD, EUR, PYG and more. Automatic conversion and consolidated view.", es: "Gestiona cuentas en BRL, USD, EUR, PYG y más. Conversión automática y vista consolidada." } },
      { icon: "🔗", title: { pt: "Open Finance & sync automático", en: "Open Finance & auto sync", es: "Open Finance & sync automático" }, desc: { pt: "Conecte seus bancos e veja transações em tempo real. Categorização automática via IA.", en: "Connect your banks and see transactions in real time. Automatic AI categorization.", es: "Conecta tus bancos y ve transacciones en tiempo real. Categorización automática por IA." } },
      { icon: "📊", title: { pt: "Orçamentos inteligentes", en: "Smart budgets", es: "Presupuestos inteligentes" }, desc: { pt: "Crie orçamentos mensais por categoria com recorrência, alertas e acompanhamento visual.", en: "Create monthly budgets by category with recurrence, alerts and visual tracking.", es: "Crea presupuestos mensuales por categoría con recurrencia, alertas y seguimiento visual." } },
      { icon: "🤖", title: { pt: "Dicas financeiras com IA", en: "AI financial tips", es: "Consejos financieros con IA" }, desc: { pt: "Receba insights personalizados baseados nos seus padrões de gasto e metas financeiras.", en: "Receive personalized insights based on your spending patterns and financial goals.", es: "Recibe insights personalizados basados en tus patrones de gasto y metas financieras." } },
      { icon: "📈", title: { pt: "Projeção de 5 anos", en: "5-year projection", es: "Proyección de 5 años" }, desc: { pt: "Visualize cenários futuros com base nos seus hábitos atuais. Planeje com confiança.", en: "Visualize future scenarios based on your current habits. Plan with confidence.", es: "Visualiza escenarios futuros basados en tus hábitos actuales. Planifica con confianza." } },
      { icon: "⚡", title: { pt: "Regras & automações", en: "Rules & automations", es: "Reglas y automatizaciones" }, desc: { pt: "Automatize categorização, tags e alertas com regras personalizadas.", en: "Automate categorization, tags and alerts with custom rules.", es: "Automatiza categorización, tags y alertas con reglas personalizadas." } },
    ],
  },
  highlight: {
    badge: { pt: "Visão completa", en: "Complete overview", es: "Vista completa" },
    title: { pt: "Seu painel financeiro, do jeito que deveria ser.", en: "Your financial dashboard, the way it should be.", es: "Tu panel financiero, como debería ser." },
    desc: { pt: "Dashboard multi-moeda com visão consolidada de todas as suas contas, receitas e despesas em tempo real.", en: "Multicurrency dashboard with a consolidated view of all your accounts, income and expenses in real time.", es: "Dashboard multimoneda con vista consolidada de todas tus cuentas, ingresos y gastos en tiempo real." },
  },
  pricing: {
    title: { pt: "Planos simples e transparentes", en: "Simple and transparent plans", es: "Planes simples y transparentes" },
    subtitle: { pt: "Comece grátis, evolua quando precisar.", en: "Start free, upgrade when you need.", es: "Empieza gratis, mejora cuando necesites." },
    monthly: { pt: "Mensal", en: "Monthly", es: "Mensual" },
    annual: { pt: "Anual", en: "Annual", es: "Anual" },
    save: { pt: "Economize 30%", en: "Save 30%", es: "Ahorra 30%" },
    mo: { pt: "/mês", en: "/mo", es: "/mes" },
    yr: { pt: "/ano", en: "/yr", es: "/año" },
    popular: { pt: "Mais popular", en: "Most popular", es: "Más popular" },
    plans: [
      {
        name: "Free",
        price: { monthly: "0", annual: "0" },
        desc: { pt: "Para começar a organizar suas finanças.", en: "To start organizing your finances.", es: "Para empezar a organizar tus finanzas." },
        cta: { pt: "Começar grátis", en: "Start free", es: "Empezar gratis" },
        featured: false,
        features: {
          pt: ["2 moedas", "3 contas bancárias", "Categorização manual", "Orçamentos básicos", "30 dias de histórico"],
          en: ["2 currencies", "3 bank accounts", "Manual categorization", "Basic budgets", "30-day history"],
          es: ["2 monedas", "3 cuentas bancarias", "Categorización manual", "Presupuestos básicos", "30 días de historial"],
        },
      },
      {
        name: "Pro",
        price: { monthly: "29,90", annual: "251" },
        desc: { pt: "Para quem quer controle total.", en: "For those who want full control.", es: "Para quienes quieren control total." },
        cta: { pt: "Assinar Pro", en: "Subscribe Pro", es: "Suscribirse Pro" },
        featured: true,
        features: {
          pt: ["Moedas ilimitadas", "Contas ilimitadas", "Open Finance sync", "Categorização por IA", "Orçamentos avançados", "Projeção de 5 anos", "Dicas financeiras personalizadas", "Regras & automações", "Exportação CSV/PDF"],
          en: ["Unlimited currencies", "Unlimited accounts", "Open Finance sync", "AI categorization", "Advanced budgets", "5-year projection", "Personalized financial tips", "Rules & automations", "CSV/PDF export"],
          es: ["Monedas ilimitadas", "Cuentas ilimitadas", "Open Finance sync", "Categorización por IA", "Presupuestos avanzados", "Proyección de 5 años", "Consejos financieros personalizados", "Reglas y automatizaciones", "Exportación CSV/PDF"],
        },
      },
      {
        name: { pt: "Pro Anual", en: "Pro Annual", es: "Pro Anual" },
        price: { monthly: "20,90", annual: "251" },
        desc: { pt: "Tudo do Pro com desconto anual.", en: "Everything in Pro with annual discount.", es: "Todo del Pro con descuento anual." },
        cta: { pt: "Assinar Pro Anual", en: "Subscribe Pro Annual", es: "Suscribirse Pro Anual" },
        featured: false,
        features: {
          pt: ["Tudo do plano Pro", "30% de desconto", "Suporte prioritário", "Acesso antecipado a novidades"],
          en: ["Everything in Pro plan", "30% discount", "Priority support", "Early access to new features"],
          es: ["Todo del plan Pro", "30% de descuento", "Soporte prioritario", "Acceso anticipado a novedades"],
        },
      },
    ],
  },
  disclaimer: {
    pt: "Fluxy é uma ferramenta de organização financeira pessoal. Não oferece produtos financeiros, investimentos ou aconselhamento regulado. As projeções são estimativas baseadas nos dados inseridos.",
    en: "Fluxy is a personal financial organization tool. It does not offer financial products, investments or regulated advice. Projections are estimates based on the data entered.",
    es: "Fluxy es una herramienta de organización financiera personal. No ofrece productos financieros, inversiones ni asesoramiento regulado. Las proyecciones son estimaciones basadas en los datos ingresados.",
  },
  faq: {
    title: { pt: "Perguntas frequentes", en: "Frequently asked questions", es: "Preguntas frecuentes" },
    items: [
      { q: { pt: "O Fluxy é seguro?", en: "Is Fluxy secure?", es: "¿Es seguro Fluxy?" }, a: { pt: "Sim. Usamos criptografia de ponta a ponta, autenticação segura e nunca armazenamos credenciais bancárias. A conexão Open Finance é intermediada por provedores regulados.", en: "Yes. We use end-to-end encryption, secure authentication and never store banking credentials. The Open Finance connection is intermediated by regulated providers.", es: "Sí. Usamos cifrado de extremo a extremo, autenticación segura y nunca almacenamos credenciales bancarias. La conexión Open Finance es intermediada por proveedores regulados." } },
      { q: { pt: "Posso usar sem conectar meu banco?", en: "Can I use it without connecting my bank?", es: "¿Puedo usarlo sin conectar mi banco?" }, a: { pt: "Sim! Você pode cadastrar transações manualmente. A conexão bancária é opcional e adiciona conveniência com sincronização automática.", en: "Yes! You can register transactions manually. Bank connection is optional and adds convenience with automatic synchronization.", es: "¡Sí! Puedes registrar transacciones manualmente. La conexión bancaria es opcional y agrega conveniencia con sincronización automática." } },
      { q: { pt: "Quais moedas são suportadas?", en: "Which currencies are supported?", es: "¿Qué monedas son soportadas?" }, a: { pt: "Suportamos BRL, USD, EUR, PYG, GBP, ARS, CLP, COP, MXN, JPY, CAD, AUD e mais. Novas moedas são adicionadas regularmente.", en: "We support BRL, USD, EUR, PYG, GBP, ARS, CLP, COP, MXN, JPY, CAD, AUD and more. New currencies are added regularly.", es: "Soportamos BRL, USD, EUR, PYG, GBP, ARS, CLP, COP, MXN, JPY, CAD, AUD y más. Nuevas monedas se agregan regularmente." } },
      { q: { pt: "Como funciona a projeção de 5 anos?", en: "How does the 5-year projection work?", es: "¿Cómo funciona la proyección de 5 años?" }, a: { pt: "Analisamos seus padrões de receita, despesa e investimento para criar cenários projetados. Você pode ajustar variáveis como inflação, crescimento de renda e metas.", en: "We analyze your income, expense and investment patterns to create projected scenarios. You can adjust variables like inflation, income growth and goals.", es: "Analizamos tus patrones de ingreso, gasto e inversión para crear escenarios proyectados. Puedes ajustar variables como inflación, crecimiento de ingresos y metas." } },
      { q: { pt: "Posso cancelar a qualquer momento?", en: "Can I cancel at any time?", es: "¿Puedo cancelar en cualquier momento?" }, a: { pt: "Sim, sem multa ou burocracia. Você mantém acesso até o fim do período pago e seus dados podem ser exportados.", en: "Yes, no penalty or bureaucracy. You keep access until the end of the paid period and your data can be exported.", es: "Sí, sin multa ni burocracia. Mantienes acceso hasta el fin del período pagado y tus datos pueden ser exportados." } },
      { q: { pt: "Meus dados estão protegidos?", en: "Is my data protected?", es: "¿Mis datos están protegidos?" }, a: { pt: "Absolutamente. Seguimos as melhores práticas de privacidade e LGPD. Seus dados nunca são vendidos ou compartilhados com terceiros.", en: "Absolutely. We follow best privacy and data protection practices. Your data is never sold or shared with third parties.", es: "Absolutamente. Seguimos las mejores prácticas de privacidad y protección de datos. Tus datos nunca se venden ni comparten con terceros." } },
    ],
  },
  ctaSection: {
    title: { pt: "Comece a ter clareza financeira hoje", en: "Start getting financial clarity today", es: "Empieza a tener claridad financiera hoy" },
    subtitle: { pt: "Junte-se a milhares de pessoas que já transformaram sua relação com o dinheiro.", en: "Join thousands of people who have already transformed their relationship with money.", es: "Únete a miles de personas que ya transformaron su relación con el dinero." },
    cta: { pt: "Criar conta gratuitamente", en: "Create free account", es: "Crear cuenta gratis" },
  },
  footer: {
    tagline: {
      pt: "Finanças inteligentes, para quem vive no mundo real.",
      en: "Smart finances, for those living in the real world.",
      es: "Finanzas inteligentes, para quienes viven en el mundo real.",
    },
    privacy: { pt: "Privacidade", en: "Privacy", es: "Privacidad" },
    terms: { pt: "Termos", en: "Terms", es: "Términos" },
    contact: { pt: "Contato", en: "Contact", es: "Contacto" },
  },
};

const FluxyLogo = ({ className = "h-8", textColor }: { className?: string; textColor?: string }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <img src={fluxyLogo} alt="Fluxy" className="h-full w-auto rounded-lg object-contain" />
    <span className={`font-extrabold text-lg tracking-tight ${textColor || "text-[#1e1b4b]"}`}>
      Fluxy
    </span>
  </div>
);

const MockDashboard = () => (
  <div className="rounded-2xl overflow-hidden shadow-2xl border border-[hsl(262_40%_30%/0.3)] flex" style={{ maxWidth: 560, width: "100%" }}>
    {/* Sidebar */}
    <div className="w-[140px] shrink-0 py-5 px-3 hidden sm:flex flex-col gap-1" style={{ background: "linear-gradient(180deg, #1e1b4b, #1a1744)" }}>
      <div className="flex items-center gap-2 px-2 mb-4">
        <div className="w-6 h-6 rounded-lg" style={{ background: "linear-gradient(135deg, #7C6FF7, #4F46E5)" }} />
        <span className="text-white/90 text-xs font-bold tracking-wide" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Fluxy</span>
      </div>
      {["Dashboard", "Contas", "Movimentos", "Categorias", "Orçamentos", "Regras"].map((item, i) => (
        <div key={item} className={`text-[11px] py-1.5 px-2 rounded-md ${i === 0 ? "bg-white/10 text-white" : "text-white/50"}`}>
          {item}
        </div>
      ))}
    </div>
    {/* Main */}
    <div className="flex-1 p-4 space-y-4" style={{ background: "#f4f2fb" }}>
      {/* BRL */}
      <div>
        <div className="text-[10px] font-bold text-[#1e1b4b] mb-1.5 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[hsl(152_56%_36%)]" /> BRL — Real Brasileiro
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Saldo total", value: "R$ 24.850", color: "#1e1b4b" },
            { label: "Receita mensal", value: "R$ 8.200", color: "hsl(152 56% 36%)" },
            { label: "Despesa mensal", value: "R$ 5.340", color: "hsl(0 72% 54%)" },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-lg p-2 shadow-sm">
              <div className="text-[8px] text-[#6b6892]">{c.label}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>
      {/* USD */}
      <div>
        <div className="text-[10px] font-bold text-[#1e1b4b] mb-1.5 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-[hsl(211_80%_46%)]" /> USD — US Dollar
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Total balance", value: "$ 3,720", color: "#1e1b4b" },
            { label: "Monthly income", value: "$ 1,500", color: "hsl(152 56% 36%)" },
            { label: "Monthly expenses", value: "$ 890", color: "hsl(0 72% 54%)" },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-lg p-2 shadow-sm">
              <div className="text-[8px] text-[#6b6892]">{c.label}</div>
              <div className="text-xs font-bold mt-0.5" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function FluxyLanding() {
  const [lang, setLang] = useState<Lang>("pt");
  const [annual, setAnnual] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Plus Jakarta Sans already loaded via index.css */}

      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-[hsl(262_40%_90%)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <FluxyLogo className="h-7 text-[#1e1b4b]" />
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#1e1b4b]/70">
              <button onClick={() => scrollTo("features")} className="hover:text-[#7C6FF7] transition-colors">{t.nav.features[lang]}</button>
              <button onClick={() => scrollTo("pricing")} className="hover:text-[#7C6FF7] transition-colors">{t.nav.plans[lang]}</button>
              <button onClick={() => scrollTo("faq")} className="hover:text-[#7C6FF7] transition-colors">{t.nav.faq[lang]}</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Lang switcher */}
            <div className="flex rounded-lg border border-[hsl(262_40%_88%)] overflow-hidden text-xs">
              {(["pt", "en", "es"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 font-medium transition-colors ${lang === l ? "bg-[#7C6FF7] text-white" : "text-[#1e1b4b]/60 hover:bg-[#f4f2fb]"}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <a href="/auth" className="hidden sm:inline-flex text-sm font-medium text-[#1e1b4b]/70 border border-[hsl(262_40%_88%)] rounded-lg px-4 py-2 hover:border-[#7C6FF7] transition-colors">
              {t.nav.login[lang]}
            </a>
            <a
              href="/auth"
              className="text-sm font-semibold text-white rounded-lg px-4 py-2 transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #7C6FF7, #4F46E5)" }}
            >
              {t.nav.cta[lang]}
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="pt-32 pb-20 px-4" style={{ background: "linear-gradient(180deg, #f4f0ff 0%, #ede9fe 40%, #f8f7ff 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#a78bfa]/30 bg-white/70 px-4 py-1.5 text-xs font-medium text-[#7C6FF7] mb-6 backdrop-blur">
            {t.hero.badge[lang]}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span className="text-[#1e1b4b]">{t.hero.heading1[lang]}</span>
            <br />
            <span style={{ background: "linear-gradient(135deg, #7C6FF7, #4F46E5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t.hero.heading2[lang]}
            </span>
          </h1>
          <p className="text-lg text-[#1e1b4b]/60 max-w-xl mx-auto mb-10">
            {t.hero.subtitle[lang]}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <a
              href="/auth"
              className="text-base font-semibold text-white rounded-xl px-8 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: "linear-gradient(135deg, #7C6FF7, #4F46E5)" }}
            >
              {t.hero.cta[lang]}
            </a>
            <button
              onClick={() => scrollTo("highlight")}
              className="text-base font-medium text-[#1e1b4b]/70 border border-[#a78bfa]/30 rounded-xl px-8 py-3.5 hover:border-[#7C6FF7] hover:text-[#7C6FF7] transition-colors"
            >
              {t.hero.demo[lang]}
            </button>
          </div>
          <div className="flex justify-center">
            <MockDashboard />
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-14 px-4" style={{ background: "#1e1b4b" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {t.stats.items.map((s, i) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#a78bfa] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</div>
              <div className="text-sm text-white/60">{s.label[lang]}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e1b4b] mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t.features.title[lang]}
          </h2>
          <p className="text-[#1e1b4b]/50">{t.features.subtitle[lang]}</p>
        </div>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.features.items.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-[hsl(262_40%_92%)] p-6 bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:border-[#7C6FF7]/40"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-bold text-[#1e1b4b] mb-2">{f.title[lang]}</h3>
              <p className="text-sm text-[#1e1b4b]/55 leading-relaxed">{f.desc[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DASHBOARD HIGHLIGHT ─── */}
      <section id="highlight" className="py-20 px-4" style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)" }}>
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block rounded-full bg-[#7C6FF7]/20 text-[#a78bfa] text-xs font-semibold px-3 py-1 mb-4">
              {t.highlight.badge[lang]}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {t.highlight.title[lang]}
            </h2>
            <p className="text-[#a78bfa]/80 text-base leading-relaxed max-w-md mx-auto lg:mx-0">
              {t.highlight.desc[lang]}
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <MockDashboard />
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-20 px-4 bg-[#f8f7ff]">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1e1b4b] mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t.pricing.title[lang]}
          </h2>
          <p className="text-[#1e1b4b]/50 mb-6">{t.pricing.subtitle[lang]}</p>
          <div className="inline-flex items-center gap-3 bg-white rounded-full border border-[hsl(262_40%_90%)] p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm font-medium rounded-full px-4 py-1.5 transition-colors ${!annual ? "bg-[#7C6FF7] text-white" : "text-[#1e1b4b]/60"}`}
            >
              {t.pricing.monthly[lang]}
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-sm font-medium rounded-full px-4 py-1.5 transition-colors ${annual ? "bg-[#7C6FF7] text-white" : "text-[#1e1b4b]/60"}`}
            >
              {t.pricing.annual[lang]}
            </button>
            {annual && (
              <span className="text-[10px] font-bold text-[#7C6FF7] bg-[#7C6FF7]/10 rounded-full px-2 py-0.5">
                {t.pricing.save[lang]}
              </span>
            )}
          </div>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {t.pricing.plans.map((plan, i) => {
            const name = typeof plan.name === "string" ? plan.name : plan.name[lang];
            const price = annual ? plan.price.annual : plan.price.monthly;
            const suffix = annual ? t.pricing.yr[lang] : t.pricing.mo[lang];
            return (
              <div
                key={i}
                className={`relative rounded-2xl p-6 bg-white transition-all hover:-translate-y-1 hover:shadow-xl ${
                  plan.featured ? "border-2 border-[#7C6FF7] shadow-lg" : "border border-[hsl(262_40%_92%)]"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white bg-[#7C6FF7] rounded-full px-3 py-0.5">
                    {t.pricing.popular[lang]}
                  </span>
                )}
                <h3 className="text-xl font-bold text-[#1e1b4b] mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{name}</h3>
                <p className="text-sm text-[#1e1b4b]/50 mb-4">{plan.desc[lang]}</p>
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
                      : "text-[#7C6FF7] border border-[#7C6FF7]/30 hover:border-[#7C6FF7]"
                  }`}
                  style={plan.featured ? { background: "linear-gradient(135deg, #7C6FF7, #4F46E5)" } : {}}
                >
                  {plan.cta[lang]}
                </a>
                <ul className="space-y-2.5">
                  {plan.features[lang].map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-[#1e1b4b]/70">
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#7C6FF7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

      {/* ─── DISCLAIMER ─── */}
      <section className="py-6 px-4 bg-[#f0eef5]">
        <p className="max-w-4xl mx-auto text-center text-[11px] text-[#1e1b4b]/40">
          {t.disclaimer[lang]}
        </p>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 px-4 bg-white">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-3xl font-extrabold text-[#1e1b4b] text-center mb-10" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t.faq.title[lang]}
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {t.faq.items.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-[hsl(262_40%_92%)] rounded-xl px-5 overflow-hidden">
                <AccordionTrigger className="text-sm font-semibold text-[#1e1b4b] hover:no-underline py-4">
                  {item.q[lang]}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#1e1b4b]/60 leading-relaxed">
                  {item.a[lang]}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-20 px-4" style={{ background: "linear-gradient(135deg, #312e81, #4F46E5, #7C6FF7)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <FluxyLogo className="h-10 mx-auto mb-6" textColor="text-white" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {t.ctaSection.title[lang]}
          </h2>
          <p className="text-white/60 mb-8">{t.ctaSection.subtitle[lang]}</p>
          <a
            href="/auth"
            className="inline-block text-base font-semibold rounded-xl px-8 py-3.5 bg-white text-[#4F46E5] hover:-translate-y-0.5 hover:shadow-xl transition-all"
          >
            {t.ctaSection.cta[lang]}
          </a>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-10 px-4" style={{ background: "#0f0d24" }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <FluxyLogo className="h-6" textColor="text-white" />
            <span className="text-xs text-white/30">{t.footer.tagline[lang]}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">{t.footer.privacy[lang]}</a>
            <a href="#" className="hover:text-white/70 transition-colors">{t.footer.terms[lang]}</a>
            <a href="#" className="hover:text-white/70 transition-colors">{t.footer.contact[lang]}</a>
          </div>
          <div className="text-xs text-white/20">© {new Date().getFullYear()} Fluxy</div>
        </div>
      </footer>
    </div>
  );
}
