import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { snapshot } = await req.json();
    if (!snapshot) throw new Error("Missing snapshot data");

    const prompt = `Você é um consultor financeiro pessoal brasileiro. Analise os dados financeiros abaixo e retorne EXATAMENTE 3 dicas personalizadas.

Dados do usuário:
- Renda mensal: R$ ${snapshot.totalIncomeBRL}
- Despesas mensais: R$ ${snapshot.totalExpensesBRL}
- Taxa de poupança: ${snapshot.savingsRate}%
- Principais categorias de gasto: ${JSON.stringify(snapshot.topCategories)}
- Alertas de orçamento: ${JSON.stringify(snapshot.budgetAlerts)}

Responda APENAS com um JSON array, sem markdown, sem explicação:
[{"titulo":"max 8 palavras","descricao":"max 40 palavras","tipo":"economia|alerta|conquista"}]

Regras:
- Se savingsRate > 15%, inclua uma dica tipo "conquista"
- Se algum budgetAlert tem spent > limit, inclua uma dica tipo "alerta"
- Sempre inclua pelo menos uma dica tipo "economia"
- Seja específico usando os dados reais do usuário`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você responde APENAS em JSON válido. Sem markdown, sem code blocks." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_tips",
              description: "Return exactly 3 financial tips",
              parameters: {
                type: "object",
                properties: {
                  tips: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        titulo: { type: "string" },
                        descricao: { type: "string" },
                        tipo: { type: "string", enum: ["economia", "alerta", "conquista"] },
                      },
                      required: ["titulo", "descricao", "tipo"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["tips"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_tips" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let tips;

    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      tips = parsed.tips;
    } else {
      const content = result.choices?.[0]?.message?.content || "[]";
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      tips = JSON.parse(cleaned);
    }

    return new Response(JSON.stringify({ tips }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tips error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
