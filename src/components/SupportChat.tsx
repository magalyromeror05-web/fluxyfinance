import { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, ChevronDown, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Faq = { q: string; a: string };

const FAQS_BY_PATH: Record<string, Faq[]> = {
  "/dashboard": [
    {
      q: "Como funciona o saldo total?",
      a: "O saldo total exibido no dashboard soma todas as suas contas ativas, separadas por moeda. Não há conversão automática entre moedas — cada moeda é mostrada em sua própria seção para preservar a precisão dos valores.",
    },
    {
      q: "Por que meus dados não aparecem?",
      a: "Verifique se você concluiu o onboarding e adicionou pelo menos uma conta em /contas. Se você conectou um banco, a sincronização inicial pode levar alguns minutos. Caso o problema persista, recarregue a página.",
    },
  ],
  "/movimentos": [
    {
      q: "Como adicionar uma entrada?",
      a: "Clique no botão flutuante (+) no canto inferior direito ou pressione a tecla 'N'. Selecione o tipo (entrada/saída), o valor, a categoria e a conta. Você também pode importar extratos em /extratos.",
    },
    {
      q: "Como categorizar uma transação?",
      a: "No formulário de cada transação você escolhe a categoria. Para automatizar, vá em /regras e crie regras de categorização baseadas no nome do estabelecimento ou descrição.",
    },
  ],
  "/contas": [
    {
      q: "Como adicionar uma nova conta?",
      a: "Clique em 'Nova conta' e escolha entre conta manual (saldo informado por você) ou conta conectada (sincronização automática via Open Finance). Defina nome, instituição, tipo e moeda.",
    },
    {
      q: "Posso ter contas em moedas diferentes?",
      a: "Sim. O Fluxy é multi-moeda por design. Cada conta tem sua moeda própria e os saldos nunca se misturam. A consolidação macro em BRL usa cotações do Banco Central atualizadas a cada 30 minutos.",
    },
  ],
  "/orcamentos": [
    {
      q: "Como criar um orçamento?",
      a: "Em /orcamentos clique em 'Novo orçamento', escolha a categoria, o valor limite e o período (mensal recorrente ou específico). Você pode duplicar orçamentos para o próximo mês com um clique.",
    },
    {
      q: "O que acontece quando estouro o limite?",
      a: "Você recebe uma notificação ao atingir 80% do orçamento e outra ao chegar a 100%. O Fluxy não bloqueia gastos — apenas alerta para você manter o controle.",
    },
  ],
  "/metas": [
    {
      q: "Como definir uma meta?",
      a: "Em /metas clique em 'Nova meta', informe o valor alvo, a data limite e (opcional) vincule a um investimento. O sistema calcula automaticamente quanto você precisa aportar por mês.",
    },
    {
      q: "Como acompanho meu progresso?",
      a: "Cada meta exibe uma barra de progresso com o valor atual, valor alvo e dias restantes. Atualize o valor atual manualmente ou vincule a um investimento para acompanhamento automático.",
    },
  ],
  "/saude-financeira": [
    {
      q: "Como é calculada minha saúde financeira?",
      a: "O score (0-100) é calculado por IA com base em: taxa de poupança, conformidade orçamentária, diversificação de investimentos, presença de reserva de emergência e regularidade de receitas/despesas.",
    },
    {
      q: "O que é score financeiro?",
      a: "É uma nota de 0 a 100 que resume sua saúde financeira. Acima de 70 é excelente, 50-70 é saudável, abaixo de 50 indica pontos a melhorar. O cálculo é atualizado a cada 24h.",
    },
  ],
};

const DEFAULT_FAQS: Faq[] = [
  {
    q: "Como funciona o Fluxy?",
    a: "O Fluxy é um app de gestão financeira multi-moeda. Você adiciona contas, registra movimentos (manual ou via Open Finance), define orçamentos e metas, e acompanha sua saúde financeira em tempo real.",
  },
  {
    q: "Meus dados estão seguros?",
    a: "Sim. Todos os dados são protegidos por Row-Level Security (RLS) no banco — apenas você acessa suas informações. Conexões bancárias usam padrões Open Finance regulamentados pelo Banco Central.",
  },
];

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const faqs = FAQS_BY_PATH[location.pathname] ?? DEFAULT_FAQS;

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          user_email: user.email ?? null,
          message: message.trim(),
          page_context: location.pathname,
          status: "aberto",
        })
        .select()
        .single();

      if (error) throw error;

      // Notifica suporte por email (não bloqueia o sucesso)
      supabase.functions
        .invoke("notify-support-ticket", {
          body: {
            ticketId: data.id,
            userEmail: user.email,
            message: message.trim(),
            pageContext: location.pathname,
          },
        })
        .catch((err) => console.error("Falha ao notificar suporte:", err));

      setSent(true);
      setMessage("");
      setTimeout(() => setSent(false), 6000);
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível enviar sua mensagem. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar suporte" : "Abrir suporte"}
        className={cn(
          "fixed bottom-6 right-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95",
          open && "rotate-90"
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-[60] w-[360px] max-w-[calc(100vw-3rem)]",
          "origin-bottom-right rounded-2xl border border-border bg-card shadow-2xl",
          "transition-all duration-200 ease-out",
          open
            ? "scale-100 opacity-100 pointer-events-auto"
            : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Como podemos ajudar?</p>
            <p className="text-xs text-muted-foreground">Resposta típica em até 24h</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="faq"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Perguntas frequentes
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Falar com suporte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="m-0 max-h-[420px] overflow-y-auto p-4 space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-background overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-foreground hover:bg-muted/50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform",
                      expanded === i && "rotate-180"
                    )}
                  />
                </button>
                {expanded === i && (
                  <div className="border-t border-border px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="contact" className="m-0 p-4 space-y-3">
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Mensagem recebida!</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Responderemos em até 24h no email cadastrado.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  Você está em <span className="font-medium text-foreground">{location.pathname}</span>
                </div>
                <Textarea
                  placeholder="Descreva sua dúvida ou problema..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="resize-none"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {message.length}/1000
                  </span>
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || sending}
                    size="sm"
                    className="gap-2"
                  >
                    {sending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    Enviar mensagem
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
