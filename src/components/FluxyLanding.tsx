import { useState } from "react";
import fluxyLogo from "@/assets/fluxy-logo.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Lang = "pt" | "en" | "es";

/* ─────────────────────────────── TRANSLATIONS ─────────────────────────────── */

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
      pt: "Organização financeira real",
      en: "Real financial organization",
      es: "Organización financiera real",
    },
    line1: {
      pt: "Você trabalha muito.",
      en: "You work hard.",
      es: "Trabajas mucho.",
    },
    line2: {
      pt: "Seu dinheiro some.",
      en: "Your money disappears.",
      es: "Tu dinero desaparece.",
    },
    line3: {
      pt: "O Fluxy organiza tudo.",
      en: "Fluxy organizes it all.",
      es: "Fluxy lo organiza todo.",
    },
    subtitle: {
      pt: "Organize suas contas em qualquer moeda, entenda para onde vai cada centavo e tenha clareza total das suas finanças — tudo em um só lugar.",
      en: "Organize your accounts in any currency, understand where every cent goes and have complete clarity over your finances — all in one place.",
      es: "Organiza tus cuentas en cualquier moneda, entiende a dónde va cada centavo y ten claridad total de tus finanzas — todo en un solo lugar.",
    },
    ctaPrimary: { pt: "Começar grátis", en: "Start for free", es: "Empezar gratis" },
    ctaSecondary: { pt: "Ver como funciona", en: "See how it works", es: "Ver cómo funciona" },
    noCreditCard: {
      pt: "Sem cartão de crédito · Cancele quando quiser",
      en: "No credit card · Cancel anytime",
      es: "Sin tarjeta de crédito · Cancela cuando quieras",
    },
  },
  problem: {
    title: {
      pt: "A maioria das pessoas vive sem clareza sobre o próprio dinheiro.",
      en: "Most people live without clarity about their own money.",
      es: "La mayoría de las personas vive sin claridad sobre su propio dinero.",
    },
    stats: [
      {
        icon: "💸",
        value: { pt: "Mais de 70% das pessoas", en: "More than 70% of people", es: "Más del 70% de las personas" },
        desc: { pt: "não conseguem poupar consistentemente todo mês", en: "can't save consistently every month", es: "no logran ahorrar consistentemente cada mes" },
      },
      {
        icon: "😰",
        value: { pt: "Metade dos lares", en: "Half of all households", es: "La mitad de los hogares" },
        desc: { pt: "terminam o mês sem saber onde foi o dinheiro", en: "end the month not knowing where the money went", es: "terminan el mes sin saber a dónde fue el dinero" },
      },
      {
        icon: "🌍",
        value: { pt: "Pessoas que vivem entre países", en: "People living across borders", es: "Personas que viven entre fronteras" },
        desc: { pt: "perdem o controle total das finanças", en: "lose total control of their finances", es: "pierden el control total de sus finanzas" },
      },
    ],
    transition: {
      pt: "O problema não é falta de dinheiro. É falta de organização.",
      en: "The problem isn't lack of money. It's lack of organization.",
      es: "El problema no es falta de dinero. Es falta de organización.",
    },
    cta: {
      pt: "O Fluxy foi criado para mudar isso.",
      en: "Fluxy was created to change that.",
      es: "Fluxy fue creado para cambiar eso.",
    },
  },
  dashboardSection: {
    title: {
      pt: "Tudo em um só lugar, cada moeda no seu lugar",
      en: "Everything in one place, each currency in its place",
      es: "Todo en un solo lugar, cada moneda en su lugar",
    },
    bullets: [
      { pt: "Multimoeda real — BRL, USD, EUR, PYG e mais", en: "True multicurrency — BRL, USD, EUR, PYG and more", es: "Multimoneda real — BRL, USD, EUR, PYG y más" },
      { pt: "Sincronização automática com bancos", en: "Automatic bank sync", es: "Sincronización automática con bancos" },
      { pt: "Categorização inteligente por IA", en: "Intelligent AI categorization", es: "Categorización inteligente por IA" },
    ],
  },
  features: {
    title: { pt: "Não é só um app de finanças", en: "It's not just a finance app", es: "No es solo una app de finanzas" },
    blocks: [
      {
        title: { pt: "Regras que organizam por você", en: "Rules that organize for you", es: "Reglas que organizan por ti" },
        text: {
          pt: "Crie regras para categorizar automaticamente seus gastos. Aluguel sempre como moradia, streaming sempre como lazer. Zero trabalho manual, organização perfeita desde o primeiro dia.",
          en: "Create rules to automatically categorize your expenses. Rent always as housing, streaming always as entertainment. Zero manual work, perfect organization from day one.",
          es: "Crea reglas para categorizar automáticamente tus gastos. Alquiler siempre como vivienda, streaming siempre como ocio. Cero trabajo manual, organización perfecta desde el primer día.",
        },
      },
      {
        title: { pt: "IA que entende suas finanças", en: "AI that understands your finances", es: "IA que entiende tus finanzas" },
        text: {
          pt: "O Fluxy analisa seus padrões de gasto e te dá dicas personalizadas. Não conselhos genéricos — insights baseados nos seus dados reais, todo mês.",
          en: "Fluxy analyzes your spending patterns and gives you personalized tips. Not generic advice — insights based on your real data, every month.",
          es: "Fluxy analiza tus patrones de gasto y te da consejos personalizados. No consejos genéricos — insights basados en tus datos reales, cada mes.",
        },
      },
      {
        title: { pt: "Saiba se seus gastos estão equilibrados", en: "Know if your spending is balanced", es: "Sabe si tus gastos están equilibrados" },
        text: {
          pt: "Cada categoria tem um percentual saudável recomendado. O Fluxy compara seus gastos com benchmarks reais e te avisa quando algo está fora do equilíbrio.",
          en: "Each category has a recommended healthy percentage. Fluxy compares your spending with real benchmarks and alerts you when something is out of balance.",
          es: "Cada categoría tiene un porcentaje saludable recomendado. Fluxy compara tus gastos con benchmarks reales y te avisa cuando algo está desequilibrado.",
        },
      },
      {
        title: { pt: "Uma carteira para cada moeda", en: "A wallet for each currency", es: "Una billetera para cada moneda" },
        text: {
          pt: "Vive entre países ou recebe em dólar? Gerencie BRL, USD, EUR, PYG e mais sem confusão. Cada moeda com seu saldo, orçamento e histórico completamente separados.",
          en: "Live between countries or receive in dollars? Manage BRL, USD, EUR, PYG and more without confusion. Each currency with its own balance, budget and history completely separated.",
          es: "¿Vives entre países o recibes en dólares? Gestiona BRL, USD, EUR, PYG y más sin confusión. Cada moneda con su saldo, presupuesto e historial completamente separados.",
        },
      },
    ],
  },
  extras: {
    title: { pt: "E muito mais para organizar sua vida financeira", en: "And much more to organize your financial life", es: "Y mucho más para organizar tu vida financiera" },
    subtitle: { pt: "Funcionalidades que crescem com você", en: "Features that grow with you", es: "Funcionalidades que crecen contigo" },
    items: [
      { icon: "📈", title: { pt: "Projeção financeira", en: "Financial projection", es: "Proyección financiera" }, desc: { pt: "Visualize cenários futuros com base nos seus hábitos atuais. Planeje com clareza.", en: "Visualize future scenarios based on your current habits. Plan with clarity.", es: "Visualiza escenarios futuros basados en tus hábitos actuales. Planifica con claridad." } },
      { icon: "🔗", title: { pt: "Bank sync", en: "Bank sync", es: "Bank sync" }, desc: { pt: "Conecte seus bancos e tenha transações importadas automaticamente.", en: "Connect your banks and import transactions automatically.", es: "Conecta tus bancos y ten transacciones importadas automáticamente." } },
      { icon: "📄", title: { pt: "Contratos e parcelas", en: "Contracts & installments", es: "Contratos y cuotas" }, desc: { pt: "Acompanhe financiamentos e parcelamentos com calendário de vencimentos.", en: "Track financing and installments with a due date calendar.", es: "Acompaña financiamientos y cuotas con calendario de vencimientos." } },
      { icon: "📤", title: { pt: "Exportação", en: "Export", es: "Exportación" }, desc: { pt: "Exporte seus dados em CSV ou PDF quando precisar.", en: "Export your data in CSV or PDF when you need it.", es: "Exporta tus datos en CSV o PDF cuando lo necesites." } },
      { icon: "🔔", title: { pt: "Alertas inteligentes", en: "Smart alerts", es: "Alertas inteligentes" }, desc: { pt: "Receba avisos antes de estourar orçamentos ou vencer parcelas.", en: "Get notified before busting budgets or missing installments.", es: "Recibe avisos antes de reventar presupuestos o vencer cuotas." } },
      { icon: "🌙", title: { pt: "Modo escuro", en: "Dark mode", es: "Modo oscuro" }, desc: { pt: "Interface adaptada para qualquer preferência visual.", en: "Interface adapted to any visual preference.", es: "Interfaz adaptada para cualquier preferencia visual." } },
    ],
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
          pt: ["Moedas ilimitadas", "Contas ilimitadas", "Bank sync", "Categorização por IA", "Orçamentos avançados", "Projeção de 5 anos", "Dicas financeiras personalizadas", "Regras & automações", "Exportação CSV/PDF"],
          en: ["Unlimited currencies", "Unlimited accounts", "Bank sync", "AI categorization", "Advanced budgets", "5-year projection", "Personalized financial tips", "Rules & automations", "CSV/PDF export"],
          es: ["Monedas ilimitadas", "Cuentas ilimitadas", "Bank sync", "Categorización por IA", "Presupuestos avanzados", "Proyección de 5 años", "Consejos financieros personalizados", "Reglas y automatizaciones", "Exportación CSV/PDF"],
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
    title: {
      pt: "Comece hoje. Seu dinheiro merece organização.",
      en: "Start today. Your money deserves organization.",
      es: "Empieza hoy. Tu dinero merece organización.",
    },
    subtitle: {
      pt: "Grátis para sempre no plano básico. Sem cartão de crédito.",
      en: "Free forever on the basic plan. No credit card.",
      es: "Gratis para siempre en el plan básico. Sin tarjeta de crédito.",
    },
    cta: { pt: "Criar conta grátis", en: "Create free account", es: "Crear cuenta gratis" },
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
    disclaimer: {
      pt: "Fluxy é uma ferramenta de organização financeira pessoal. Não oferece produtos financeiros, investimentos ou aconselhamento regulado.",
      en: "Fluxy is a personal financial organization tool. It does not offer financial products, investments or regulated advice.",
      es: "Fluxy es una herramienta de organización financiera personal. No ofrece productos financieros, inversiones ni asesoramiento regulado.",
    },
    copyright: `© ${new Date().getFullYear()} Fluxy. `,
    rights: {
      pt: "Todos os direitos reservados.",
      en: "All rights reserved.",
      es: "Todos los derechos reservados.",
    },
  },
};

/* ─────────────────────────────── SMALL COMPONENTS ─────────────────────────────── */

const FluxyLogo = ({ className = "h-8", textColor }: { className?: string; textColor?: string }) => (
  <div className={`flex items-center gap-2.5 ${className}`}>
    <img src={fluxyLogo} alt="Fluxy" className="h-full w-auto rounded-lg object-contain" />
    <span className={`font-extrabold text-lg tracking-tight ${textColor || "text-foreground"}`}>Fluxy</span>
  </div>
);

/* ── Hero Dashboard Mockup ── */
const HeroDashboardMockup = () => (
  <div
    className="rounded-2xl overflow-hidden border border-border bg-card shadow-elevated flex w-full max-w-[560px]"
    style={{ transform: "perspective(1000px) rotateY(-5deg)" }}
  >
    {/* Sidebar */}
    <div className="w-[130px] shrink-0 py-4 px-3 hidden sm:flex flex-col gap-0.5 bg-sidebar">
      <div className="flex items-center gap-2 px-2 mb-4">
        <img src={fluxyLogo} alt="Fluxy" className="w-5 h-5 rounded object-contain" />
        <span className="text-sidebar-primary-foreground text-[11px] font-bold">Fluxy</span>
      </div>
      {["Dashboard", "Contas", "Movimentos", "Categorias", "Orçamentos", "Projeção", "Saúde", "Regras", "Contratos", "Conexões"].map((item, i) => (
        <div
          key={item}
          className={`text-[10px] py-1 px-2 rounded-md ${i === 0 ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/50"}`}
        >
          {item}
        </div>
      ))}
    </div>
    {/* Main area */}
    <div className="flex-1 p-3 space-y-3 bg-background">
      <div className="text-[11px] font-bold text-foreground">Visão Geral</div>
      {/* BRL section */}
      <div>
        <div className="text-[9px] font-semibold text-foreground/70 mb-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brl" /> 🇧🇷 BRL
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: "Saldo", v: "R$ 24.850", cls: "text-foreground" },
            { l: "Entradas", v: "R$ 8.200", cls: "text-income" },
            { l: "Saídas", v: "R$ 5.340", cls: "text-expense" },
          ].map((c) => (
            <div key={c.l} className="bg-card rounded-lg p-1.5 border border-border">
              <div className="text-[7px] text-muted-foreground">{c.l}</div>
              <div className={`text-[10px] font-bold ${c.cls}`}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* USD section */}
      <div>
        <div className="text-[9px] font-semibold text-foreground/70 mb-1 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-usd" /> 🇺🇸 USD
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: "Balance", v: "$ 3,720", cls: "text-foreground" },
            { l: "Income", v: "$ 1,500", cls: "text-income" },
            { l: "Expenses", v: "$ 890", cls: "text-expense" },
          ].map((c) => (
            <div key={c.l} className="bg-card rounded-lg p-1.5 border border-border">
              <div className="text-[7px] text-muted-foreground">{c.l}</div>
              <div className={`text-[10px] font-bold ${c.cls}`}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Recent transactions */}
      <div>
        <div className="text-[9px] font-semibold text-foreground/70 mb-1">Movimentações recentes</div>
        {[
          { m: "Uber", v: "-R$ 32,90", cls: "text-expense" },
          { m: "Salário", v: "+R$ 8.200", cls: "text-income" },
          { m: "Netflix", v: "-R$ 55,90", cls: "text-expense" },
        ].map((tx) => (
          <div key={tx.m} className="flex items-center justify-between py-0.5">
            <span className="text-[8px] text-muted-foreground">{tx.m}</span>
            <span className={`text-[8px] font-semibold ${tx.cls}`}>{tx.v}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Full Dashboard Mockup (Section 3) ── */
const FullDashboardMockup = () => (
  <div className="rounded-2xl overflow-hidden border border-border bg-card shadow-elevated flex w-full max-w-[900px] mx-auto">
    {/* Sidebar */}
    <div className="w-[150px] shrink-0 py-5 px-3 hidden md:flex flex-col gap-0.5 bg-sidebar">
      <div className="flex items-center gap-2 px-2 mb-5">
        <img src={fluxyLogo} alt="Fluxy" className="w-6 h-6 rounded object-contain" />
        <span className="text-sidebar-primary-foreground text-xs font-bold">Fluxy</span>
      </div>
      {["📊 Dashboard", "🏦 Contas", "💸 Movimentos", "🏷️ Categorias", "📋 Orçamentos", "📈 Projeção", "❤️ Saúde", "⚡ Regras", "📄 Contratos", "🔗 Conexões"].map((item, i) => (
        <div
          key={item}
          className={`text-[11px] py-1.5 px-2 rounded-md ${i === 0 ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/50"}`}
        >
          {item}
        </div>
      ))}
    </div>
    {/* Main */}
    <div className="flex-1 p-5 space-y-5 bg-background">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-foreground">Visão Geral</div>
        <div className="text-[10px] text-muted-foreground bg-secondary rounded px-2 py-0.5">🔄 Sincronizar</div>
      </div>
      {/* BRL */}
      <div>
        <div className="text-[10px] font-bold text-foreground/80 mb-2 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-brl" /> 🇧🇷 REAL BRASILEIRO · BRL
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "Saldo total", v: "R$ 26.410,50", cls: "text-foreground" },
            { l: "Receita mensal", v: "R$ 12.800,00", cls: "text-income" },
            { l: "Despesa mensal", v: "R$ 7.240,30", cls: "text-expense" },
          ].map((c) => (
            <div key={c.l} className="bg-card rounded-xl p-3 border border-border shadow-card">
              <div className="text-[9px] text-muted-foreground mb-0.5">{c.l}</div>
              <div className={`text-sm font-bold ${c.cls}`}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* USD */}
      <div>
        <div className="text-[10px] font-bold text-foreground/80 mb-2 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-usd" /> 🇺🇸 DÓLAR AMERICANO · USD
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: "Total balance", v: "$ 4,250.75", cls: "text-foreground" },
            { l: "Monthly income", v: "$ 2,100.00", cls: "text-income" },
            { l: "Monthly expenses", v: "$ 1,320.50", cls: "text-expense" },
          ].map((c) => (
            <div key={c.l} className="bg-card rounded-xl p-3 border border-border shadow-card">
              <div className="text-[9px] text-muted-foreground mb-0.5">{c.l}</div>
              <div className={`text-sm font-bold ${c.cls}`}>{c.v}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Bottom: events + transactions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="text-[10px] font-bold text-foreground mb-2">📅 Próximos eventos</div>
          {[
            { d: "25 Mar", l: "Parcela financiamento", v: "R$ 1.200" },
            { d: "28 Mar", l: "Fatura cartão", v: "R$ 3.450" },
          ].map((e) => (
            <div key={e.l} className="flex items-center justify-between py-1 text-[9px]">
              <span className="text-muted-foreground">{e.d} — {e.l}</span>
              <span className="font-semibold text-foreground">{e.v}</span>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="text-[10px] font-bold text-foreground mb-2">💸 Últimas movimentações</div>
          {[
            { m: "Food Delivery", v: "-R$ 67,80", cls: "text-expense" },
            { m: "Freelance", v: "+R$ 2.500", cls: "text-income" },
            { m: "Spotify", v: "-R$ 34,90", cls: "text-expense" },
          ].map((tx) => (
            <div key={tx.m} className="flex items-center justify-between py-1 text-[9px]">
              <span className="text-muted-foreground">{tx.m}</span>
              <span className={`font-semibold ${tx.cls}`}>{tx.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ── Feature Visuals ── */
const RulesVisual = () => (
  <div className="space-y-2 w-full max-w-[320px]">
    {[
      { merchant: "Monthly Rent", cat: "Moradia", badge: "Regra aplicada", badgeCls: "bg-primary/10 text-primary" },
      { merchant: "Netflix", cat: "Lazer", badge: "IA", badgeCls: "bg-accent/10 text-accent" },
      { merchant: "Coffee Shop", cat: "Alimentação", badge: "Manual", badgeCls: "bg-secondary text-muted-foreground" },
    ].map((r) => (
      <div key={r.merchant} className="flex items-center justify-between bg-card rounded-xl p-3 border border-border shadow-card">
        <div>
          <div className="text-xs font-semibold text-foreground">{r.merchant}</div>
          <div className="text-[10px] text-muted-foreground">{r.cat}</div>
        </div>
        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${r.badgeCls}`}>{r.badge}</span>
      </div>
    ))}
  </div>
);

const AITipsVisual = () => (
  <div className="space-y-2 w-full max-w-[320px]">
    {[
      { icon: "💰", text: "Você gastou 40% a mais em restaurantes este mês", cls: "border-l-4 border-l-expense" },
      { icon: "🏆", text: "Sua taxa de poupança subiu 12% vs mês anterior", cls: "border-l-4 border-l-income" },
      { icon: "⚠️", text: "Assinaturas consomem 18% da sua renda", cls: "border-l-4 border-l-pyg" },
    ].map((tip) => (
      <div key={tip.text} className={`bg-card rounded-xl p-3 border border-border shadow-card ${tip.cls}`}>
        <div className="text-xs text-foreground">
          <span className="mr-1.5">{tip.icon}</span>{tip.text}
        </div>
      </div>
    ))}
  </div>
);

const HealthBarsVisual = () => (
  <div className="space-y-3 w-full max-w-[320px]">
    {[
      { cat: "Moradia", pct: 28, ideal: 30, color: "bg-income", status: "✅" },
      { cat: "Alimentação", pct: 17, ideal: 15, color: "bg-pyg", status: "🟡" },
      { cat: "Assinaturas", pct: 22, ideal: 5, color: "bg-expense", status: "🔴" },
    ].map((b) => (
      <div key={b.cat} className="bg-card rounded-xl p-3 border border-border shadow-card">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-foreground">{b.cat}</span>
          <span className="text-[10px] text-muted-foreground">{b.status} {b.pct}% (ideal: {b.ideal}%)</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${b.color}`} style={{ width: `${Math.min(b.pct * 2.5, 100)}%` }} />
        </div>
      </div>
    ))}
  </div>
);

const CurrencyWalletsVisual = () => (
  <div className="space-y-2 w-full max-w-[320px]">
    {[
      { flag: "🇧🇷", code: "BRL", amount: "R$ 26.410,50", dotCls: "bg-brl" },
      { flag: "🇺🇸", code: "USD", amount: "US$ 4.250,75", dotCls: "bg-usd" },
      { flag: "🇪🇺", code: "EUR", amount: "€ 1.830,00", dotCls: "bg-primary" },
      { flag: "🇵🇾", code: "PYG", amount: "₲ 14.500.000", dotCls: "bg-pyg" },
    ].map((c) => (
      <div key={c.code} className="flex items-center justify-between bg-card rounded-xl p-3 border border-border shadow-card">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${c.dotCls}`} />
          <span className="text-lg">{c.flag}</span>
          <span className="text-xs font-semibold text-foreground">{c.code}</span>
        </div>
        <span className="text-sm font-bold text-foreground tabular-nums">{c.amount}</span>
      </div>
    ))}
  </div>
);

/* ─────────────────────────────── MAIN COMPONENT ─────────────────────────────── */

export default function FluxyLanding() {
  const [lang, setLang] = useState<Lang>("pt");
  const [annual, setAnnual] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const featureVisuals = [<RulesVisual />, <AITipsVisual />, <HealthBarsVisual />, <CurrencyWalletsVisual />];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <FluxyLogo className="h-7" />
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/70">
              <button onClick={() => scrollTo("features")} className="hover:text-primary transition-colors">{t.nav.features[lang]}</button>
              <button onClick={() => scrollTo("pricing")} className="hover:text-primary transition-colors">{t.nav.plans[lang]}</button>
              <button onClick={() => scrollTo("faq")} className="hover:text-primary transition-colors">{t.nav.faq[lang]}</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Lang switcher */}
            <div className="flex rounded-lg border border-border overflow-hidden text-xs">
              {(["pt", "en", "es"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2.5 py-1.5 font-medium transition-colors ${lang === l ? "bg-primary text-primary-foreground" : "text-foreground/60 hover:bg-secondary"}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <a href="/auth" className="hidden sm:inline-flex text-sm font-medium text-foreground/70 border border-border rounded-lg px-4 py-2 hover:border-primary transition-colors">
              {t.nav.login[lang]}
            </a>
            <a href="/auth" className="text-sm font-semibold text-primary-foreground bg-primary rounded-lg px-4 py-2 transition-all hover:-translate-y-0.5 hover:shadow-lg">
              {t.nav.cta[lang]}
            </a>
          </div>
        </div>
      </nav>

      {/* ─── SECTION 1: HERO ─── */}
      <section className="pt-28 pb-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-block rounded-full bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 mb-6">
              {t.hero.badge[lang]}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-6 text-foreground">
              {t.hero.line1[lang]}<br />
              {t.hero.line2[lang]}<br />
              <span className="text-primary">{t.hero.line3[lang]}</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-8 leading-relaxed">
              {t.hero.subtitle[lang]}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-4">
              <a href="/auth" className="text-sm font-semibold text-primary-foreground bg-primary rounded-xl px-7 py-3 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                {t.hero.ctaPrimary[lang]}
              </a>
              <button
                onClick={() => scrollTo("features")}
                className="text-sm font-medium text-foreground/70 border border-border rounded-xl px-7 py-3 hover:border-primary hover:text-primary transition-colors"
              >
                {t.hero.ctaSecondary[lang]}
              </button>
            </div>
            <p className="text-xs text-muted-foreground/60">{t.hero.noCreditCard[lang]}</p>
          </div>
          {/* Right: mockup */}
          <div className="flex-1 flex justify-center">
            <HeroDashboardMockup />
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: PROBLEM ─── */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-[700px] mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-12 leading-tight">
            {t.problem.title[lang]}
          </h2>
          <div className="grid sm:grid-cols-3 gap-8 mb-12">
            {t.problem.stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="text-lg font-bold text-foreground mb-1">{s.value[lang]}</div>
                <div className="text-sm text-muted-foreground">{s.desc[lang]}</div>
              </div>
            ))}
          </div>
          <p className="text-base text-muted-foreground mb-4 italic">
            {t.problem.transition[lang]}
          </p>
          <p className="text-xl font-bold text-primary">
            {t.problem.cta[lang]}
          </p>
        </div>
      </section>

      {/* ─── SECTION 3: DASHBOARD ─── */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground text-center mb-12">
            {t.dashboardSection.title[lang]}
          </h2>
          <FullDashboardMockup />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            {t.dashboardSection.bullets.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {b[lang]}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: STRATEGIC FEATURES ─── */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground text-center mb-16">
            {t.features.title[lang]}
          </h2>
          <div className="space-y-20">
            {t.features.blocks.map((block, i) => {
              const isReversed = i % 2 === 1;
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isReversed ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`}
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-3">{block.title[lang]}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{block.text[lang]}</p>
                  </div>
                  <div className="flex-1 flex justify-center">{featureVisuals[i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: EXTRAS ─── */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            {t.extras.title[lang]}
          </h2>
          <p className="text-muted-foreground">{t.extras.subtitle[lang]}</p>
        </div>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {t.extras.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className="text-2xl mb-2">{item.icon}</div>
              <h3 className="text-sm font-bold text-foreground mb-1">{item.title[lang]}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc[lang]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 6: PRICING ─── */}
      <section id="pricing" className="py-20 px-4 bg-card">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            {t.pricing.title[lang]}
          </h2>
          <p className="text-muted-foreground mb-6">{t.pricing.subtitle[lang]}</p>
          <div className="inline-flex items-center gap-3 bg-background rounded-full border border-border p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm font-medium rounded-full px-4 py-1.5 transition-colors ${!annual ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}
            >
              {t.pricing.monthly[lang]}
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-sm font-medium rounded-full px-4 py-1.5 transition-colors ${annual ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}
            >
              {t.pricing.annual[lang]}
            </button>
            {annual && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
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
                className={`relative rounded-2xl p-6 bg-background transition-all hover:-translate-y-1 hover:shadow-elevated ${
                  plan.featured ? "border-2 border-primary shadow-elevated" : "border border-border"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-primary-foreground bg-primary rounded-full px-3 py-0.5">
                    {t.pricing.popular[lang]}
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground mb-1">{name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.desc[lang]}</p>
                <div className="mb-5">
                  <span className="text-4xl font-extrabold text-foreground">
                    {price === "0" ? "R$ 0" : `R$ ${price}`}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">{price !== "0" ? suffix : ""}</span>
                </div>
                <a
                  href="/auth"
                  className={`block text-center text-sm font-semibold rounded-xl py-3 mb-6 transition-all hover:-translate-y-0.5 ${
                    plan.featured
                      ? "text-primary-foreground bg-primary hover:shadow-lg"
                      : "text-primary border border-primary/30 hover:border-primary"
                  }`}
                >
                  {plan.cta[lang]}
                </a>
                <ul className="space-y-2.5">
                  {plan.features[lang].map((feat, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm text-foreground/70">
                      <svg className="w-4 h-4 mt-0.5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

      {/* ─── SECTION 7: FAQ ─── */}
      <section id="faq" className="py-20 px-4 bg-background">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground text-center mb-10">
            {t.faq.title[lang]}
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {t.faq.items.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-xl px-5 overflow-hidden">
                <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline py-4">
                  {item.q[lang]}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {item.a[lang]}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── SECTION 8: CTA FINAL ─── */}
      <section className="py-20 px-4 bg-sidebar">
        <div className="max-w-2xl mx-auto text-center">
          <FluxyLogo className="h-10 mx-auto mb-6" textColor="text-sidebar-primary-foreground" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-sidebar-primary-foreground mb-4">
            {t.ctaSection.title[lang]}
          </h2>
          <p className="text-sidebar-foreground/60 mb-8">{t.ctaSection.subtitle[lang]}</p>
          <a
            href="/auth"
            className="inline-block text-base font-semibold rounded-xl px-8 py-3.5 bg-primary-foreground text-primary hover:-translate-y-0.5 hover:shadow-xl transition-all"
          >
            {t.ctaSection.cta[lang]}
          </a>
        </div>
      </section>

      {/* ─── SECTION 9: FOOTER ─── */}
      <footer className="py-10 px-4 bg-sidebar border-t border-sidebar-border">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <FluxyLogo className="h-6" textColor="text-sidebar-primary-foreground" />
            <span className="text-xs text-sidebar-foreground/40">{t.footer.tagline[lang]}</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-sidebar-foreground/40">
            <a href="#" className="hover:text-sidebar-foreground/70 transition-colors">{t.footer.privacy[lang]}</a>
            <a href="#" className="hover:text-sidebar-foreground/70 transition-colors">{t.footer.terms[lang]}</a>
            <a href="#" className="hover:text-sidebar-foreground/70 transition-colors">{t.footer.contact[lang]}</a>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-6">
          <p className="text-[10px] text-sidebar-foreground/25 text-center">{t.footer.disclaimer[lang]}</p>
          <p className="text-[10px] text-sidebar-foreground/20 text-center mt-1">{t.footer.copyright}{t.footer.rights[lang]}</p>
        </div>
      </footer>
    </div>
  );
}
